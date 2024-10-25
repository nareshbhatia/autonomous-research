import type { Position } from 'geojson';

export interface VehicleLocationUpdated {
  type: 'VehicleLocationUpdated';
  vehicleId: string;
  location: Position;
  timestamp: Date;
}

export interface VehicleRouteChanged {
  type: 'VehicleRouteChanged';
  vehicleId: string;
  waypoints: Position[];
  route: Position[];
  timestamp: Date;
}

export type VehicleEvent = VehicleLocationUpdated | VehicleRouteChanged;
