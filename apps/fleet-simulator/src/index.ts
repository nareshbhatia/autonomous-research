import { FleetSimulator } from './FleetSimulator';
import type { LocationUpdate } from './types/MapboxDirections';
import axios from 'axios';

const mapboxToken = process.env.MAPBOX_TOKEN ?? '';
const vehicleEventsUrl =
  process.env.VEHICLE_EVENTS_URL ?? 'http://vehicle-events:8080';

async function main() {
  const simulator = new FleetSimulator(
    1000, // Update every 1 seconds
    { minLat: 37.7, maxLat: 37.8, minLon: -122.5, maxLon: -122.4 }, // San Francisco area
    mapboxToken,
  );

  // Add vehicles every 2 seconds
  console.log('fleet-simulator: adding vehicles...');
  for (let i = 1; i <= 10; i++) {
    await simulator.addVehicle(`v${i}`);
    if (i < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Listen for location updates
  simulator.on('locationUpdate', (update: LocationUpdate) => {
    // send location update to vehicle events service
    const url = `${vehicleEventsUrl}/location-update`;
    axios
      .post(url, update)
      .then(() => true)
      .catch((error) => {
        console.error('Error posting location:', error);
      });
  });

  // Start the simulation
  console.log('fleet-simulator: started');
  simulator.start();

  /*
   * Run for 5 minutes
   * await new Promise((resolve) => setTimeout(resolve, 300000));
   */

  /*
   * Stop the simulation
   * simulator.stop();
   */
}

main().catch(console.error);
