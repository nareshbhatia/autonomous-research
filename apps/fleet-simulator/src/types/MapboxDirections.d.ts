import type { LineString } from 'geojson';

export interface Lane {
  indications: string[];
  valid: boolean;
  active: boolean;
}

export interface Intersection {
  location: [number, number];
  bearings: number[];
  entry: boolean[];
  classes?: string[];
  in?: number;
  out?: number;
  lanes?: Lane[];
}

export interface Maneuver {
  location: [number, number];
  instruction: string;
  type: string;
  modifier?: string;
  bearing_before: number;
  bearing_after: number;
}

export interface Step {
  geometry: LineString;
  intersections: Intersection[];
  maneuver: Maneuver;
  mode: string;
  duration: number;
  distance: number;
  name: string;
  weight: number;
  driving_side: string;
}

export interface Leg {
  steps: Step[];
  summary: string;
  weight: number;
  duration: number;
  distance: number;
}

export interface Route {
  geometry: LineString;
  legs: Leg[];
  weight_name: string;
  weight: number;
  duration: number;
  distance: number;
}

export interface Waypoint {
  name: string;
  location: [number, number];
}

export interface DirectionsResponse {
  routes: Route[];
  waypoints: Waypoint[];
  code: string;
  uuid: string;
}

interface Vehicle {
  id: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  route: Position[]; // Array of [longitude, latitude] pairs
  routeIndex: number;
}

interface LocationUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}
