import type { DirectionsService } from '@mapbox/mapbox-sdk/services/directions';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import type { Position } from 'geojson';

interface RouteResult {
  // waypoints snapped to the road network
  waypoints: Position[];
  // points representing the route
  route: Position[];
}

export async function getRoute(
  waypoints: Position[],
  accessToken: string,
): Promise<RouteResult> {
  const directionsService: DirectionsService = mbxDirections({ accessToken });

  try {
    const response = await directionsService
      .getDirections({
        waypoints: waypoints.map((position) => ({
          coordinates: [position[0], position[1]],
        })),
        profile: 'driving',
        geometries: 'geojson',
      })
      .send();

    const directions = response.body;

    if (directions.routes.length === 0) {
      throw new Error('No route found');
    }

    const snappedWaypoints = directions.waypoints.map(
      // @ts-expect-error: 'location' is not typed in the response
      (wp) => wp.location as Position,
    );
    const route = directions.routes[0].geometry.coordinates as Position[];

    return {
      waypoints: snappedWaypoints,
      route,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get route: ${error.message}`);
    } else {
      throw new Error(`Failed to get route`);
    }
  }
}
