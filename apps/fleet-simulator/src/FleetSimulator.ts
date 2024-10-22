import type {
  DirectionsResponse,
  LocationUpdate,
  Vehicle,
} from './types/MapboxDirections';
import axios from 'axios';
import { EventEmitter } from 'events';
import type { Position } from 'geojson';

export class FleetSimulator extends EventEmitter {
  private readonly vehicles: Map<string, Vehicle> = new Map();
  private intervalId: NodeJS.Timeout | undefined = undefined;
  private readonly updateIntervalMs: number;
  private readonly bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  private readonly mapboxToken: string;

  public constructor(
    updateIntervalMs: number,
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
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
      latitude: location[1],
      longitude: location[0],
      speed: this.randomBetween(30, 80), // Random speed between 30 and 80 km/h
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

  private async getRoute(
    start: [number, number],
    end: [number, number],
  ): Promise<Position[]> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}`;

    try {
      const response = await axios.get<DirectionsResponse>(url, {
        params: {
          geometries: 'geojson',
          // eslint-disable-next-line camelcase
          access_token: this.mapboxToken,
        },
      });
      return response.data.routes[0].geometry.coordinates;
    } catch (error) {
      console.error('Error fetching route:', error);
      return [start, end]; // Fallback to direct route if API call fails
    }
  }

  private async updateVehicleLocations() {
    for (const [id, vehicle] of this.vehicles) {
      await this.updateVehicleLocation(vehicle);
      const update: LocationUpdate = {
        vehicleId: id,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        timestamp: Date.now(),
      };
      this.emit('locationUpdate', update);
    }
  }

  private async updateVehicleLocation(vehicle: Vehicle) {
    if (vehicle.routeIndex >= vehicle.route.length - 1) {
      // Vehicle has reached its destination, get a new route
      await this.getNewRoute(vehicle);
      return;
    }

    const nextPoint = vehicle.route[vehicle.routeIndex + 1] as Position;

    // Calculate distance to next point
    const distance = this.haversineDistance(
      vehicle.latitude,
      vehicle.longitude,
      nextPoint[1],
      nextPoint[0],
    );

    // Calculate time to next point based on current speed
    const timeToNextPoint = (distance / vehicle.speed) * 3600; // in seconds

    if (timeToNextPoint <= this.updateIntervalMs / 1000) {
      // Vehicle has reached (or passed) the next point
      vehicle.routeIndex++;
      [vehicle.longitude, vehicle.latitude] = nextPoint;
    } else {
      // Interpolate new position
      const ratio = this.updateIntervalMs / 1000 / timeToNextPoint;
      vehicle.latitude += (nextPoint[1] - vehicle.latitude) * ratio;
      vehicle.longitude += (nextPoint[0] - vehicle.longitude) * ratio;
    }

    // Occasionally change speed
    if (Math.random() < 0.1) {
      // 10% chance to change every update
      vehicle.speed = this.randomBetween(30, 80);
    }
  }

  private async getNewRoute(vehicle: Vehicle): Promise<void> {
    const startPoint: [number, number] = [vehicle.longitude, vehicle.latitude];
    const endPoint = this.getRandomPointInBounds();
    vehicle.route = await this.getRoute(startPoint, endPoint);
    // console.log(`Vehicle ${vehicle.id} new route:`, vehicle.route);
    vehicle.routeIndex = 0;
  }

  private getRandomPointInBounds(): [number, number] {
    return [
      this.randomBetween(this.bounds.minLon, this.bounds.maxLon),
      this.randomBetween(this.bounds.minLat, this.bounds.maxLat),
    ];
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
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
