import { getRoute } from './getRoute';
import type { Position } from 'geojson';

const mapboxToken = 'your-mapbox-token';

describe('getRoute', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should return the correct route', async () => {
    const waypoints: Position[] = [
      [-122.4194, 37.7749], // San Francisco
      [-122.2711, 37.8044], // Berkeley
    ];

    const result = await getRoute(waypoints, mapboxToken);

    expect(result.waypoints.length).toBeGreaterThan(0);
    expect(result.route.length).toBeGreaterThan(0);
  });
});
