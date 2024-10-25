import type {
  Vehicle,
  VehicleLocationUpdated,
  VehicleRouteChanged,
} from '@nareshbhatia/autonomous-research-domain';
import { getRoute } from '@nareshbhatia/autonomous-research-domain';
import { EventEmitter } from 'events';
import type { Position } from 'geojson';

export class FleetSimulator extends EventEmitter {
  private readonly vehicles: Map<string, Vehicle> = new Map();
  private intervalId: NodeJS.Timeout | undefined = undefined;
  private readonly updateIntervalMs: number;
  private readonly bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  private readonly mapboxToken: string;

  public constructor(
    updateIntervalMs: number,
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    mapboxToken: string,
  ) {
    super();
    this.updateIntervalMs = updateIntervalMs;
    this.bounds = bounds;
    this.mapboxToken = mapboxToken;
  }

  public async addVehicle(id: string): Promise<void> {
    const location = this.getRandomPointInBounds();

    const vehicle: Vehicle = {
      id,
      location,
      speed: this.randomBetween(30, 80), // Random speed between 30 and 80 km/h
      waypoints: [],
      route: [],
      routeIndex: 0,
    };
    await this.getNewRoute(vehicle);
    this.vehicles.set(id, vehicle);
  }

  public removeVehicle(id: string): void {
    this.vehicles.delete(id);
  }

  public start(): void {
    if (this.intervalId) return; // Already started

    this.intervalId = setInterval(() => {
      this.updateVehicleLocations()
        .then(() => true)
        .catch((e) => {
          console.log(e);
        });
    }, this.updateIntervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async updateVehicleLocations() {
    for (const [id, vehicle] of this.vehicles) {
      await this.updateVehicleLocation(vehicle);
      const vehicleLocationUpdated: VehicleLocationUpdated = {
        type: 'VehicleLocationUpdated',
        vehicleId: id,
        location: vehicle.location,
        timestamp: new Date(),
      };
      this.emit('vehicleEvent', vehicleLocationUpdated);
    }
  }

  private async updateVehicleLocation(vehicle: Vehicle) {
    if (vehicle.routeIndex >= vehicle.route.length - 1) {
      // Vehicle has reached its destination, get a new route
      await this.getNewRoute(vehicle);
      return;
    }

    const nextPoint = vehicle.route[vehicle.routeIndex + 1];

    // Calculate distance to next point
    const distance = this.haversineDistance(vehicle.location, nextPoint);

    // Calculate time to next point based on current speed
    const timeToNextPoint = (distance / vehicle.speed) * 3600; // in seconds

    if (timeToNextPoint <= this.updateIntervalMs / 1000) {
      // Vehicle has reached (or passed) the next point
      vehicle.routeIndex++;
      vehicle.location = nextPoint;
    } else {
      // Interpolate new position
      const ratio = this.updateIntervalMs / 1000 / timeToNextPoint;
      vehicle.location[0] += (nextPoint[0] - vehicle.location[0]) * ratio;
      vehicle.location[1] += (nextPoint[1] - vehicle.location[1]) * ratio;
    }

    // Occasionally change speed
    if (Math.random() < 0.1) {
      // 10% chance to change every update
      vehicle.speed = this.randomBetween(30, 80);
    }
  }

  private async getNewRoute(vehicle: Vehicle): Promise<void> {
    const waypoints: Position[] = [
      vehicle.location,
      this.getRandomPointInBounds(),
    ];
    const result = await getRoute(waypoints, this.mapboxToken);

    vehicle.location = [...result.waypoints[0]];
    vehicle.waypoints = result.waypoints;
    vehicle.route = result.route;
    vehicle.routeIndex = 0;
    // console.log(`Vehicle ${vehicle.id} new route:`, vehicle.route);

    const vehicleRouteChanged: VehicleRouteChanged = {
      type: 'VehicleRouteChanged',
      vehicleId: vehicle.id,
      waypoints: vehicle.waypoints,
      route: vehicle.route,
      timestamp: new Date(),
    };
    this.emit('vehicleEvent', vehicleRouteChanged);
  }

  private getRandomPointInBounds(): Position {
    return [
      this.randomBetween(this.bounds.minLng, this.bounds.maxLng),
      this.randomBetween(this.bounds.minLat, this.bounds.maxLat),
    ];
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private haversineDistance(position1: Position, position2: Position): number {
    const [lng1, lat1] = position1;
    const [lng2, lat2] = position2;

    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
