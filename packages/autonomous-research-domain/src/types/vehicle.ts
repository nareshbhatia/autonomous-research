import type { Position } from 'geojson';

export interface Vehicle {
  id: string;

  // current location [lng, lat]
  location: Position;

  // fixed speed in km/h
  speed: number;

  // array of waypoints (stops in a trip) (usually 2) [lng, lat]
  waypoints: Position[];

  // array of points on the actual route [lng, lat]
  route: Position[];

  // index of the current position in the route array
  routeIndex: number;
}
