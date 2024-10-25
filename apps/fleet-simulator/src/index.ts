import { FleetSimulator } from './FleetSimulator';
import type { VehicleEvent } from '@nareshbhatia/autonomous-research-domain';
import axios from 'axios';

const mapboxToken = process.env.MAPBOX_TOKEN ?? '';
const vehicleEventsUrl =
  process.env.VEHICLE_EVENTS_URL ?? 'http://vehicle-events:8080';
const vehicleCount = Number(process.env.VEHICLE_COUNT ?? '10');
const vehicleAddFrequencyMs = Number(
  process.env.VEHICLE_ADD_FREQUENCY_MS ?? '2000',
);
const locationUpdateFrequencyMs = Number(
  process.env.LOCATION_UPDATE_FREQUENCY_MS ?? '1000',
);

function main() {
  const simulator = new FleetSimulator(
    locationUpdateFrequencyMs,
    { minLat: 37.7, maxLat: 37.8, minLng: -122.5, maxLng: -122.4 }, // San Francisco area
    mapboxToken,
  );

  // Listen for vehicle events from the simulator
  simulator.on('vehicleEvent', (event: VehicleEvent) => {
    // send event to vehicle events service
    const url = `${vehicleEventsUrl}/api/vehicles/${event.vehicleId}/event`;
    axios
      .post(url, event)
      .then(() => true)
      .catch((error) => {
        console.error('Error posting location:', error);
      });
  });

  // Start the simulation
  console.log('fleet-simulator: started');
  simulator.start();

  // Add vehicles every vehicleAddFrequencyMs
  console.log('fleet-simulator: adding vehicles...');
  let i = 0;
  setInterval(() => {
    async function AddVehicle() {
      if (i < vehicleCount) {
        await simulator.addVehicle(`v${i + 1}`);
        i++;
      }
    }

    void AddVehicle();
  }, vehicleAddFrequencyMs);
}

main();
