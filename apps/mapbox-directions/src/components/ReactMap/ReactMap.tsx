import type { DirectionsResponse } from '@/types/MapboxDirections';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import axios from 'axios';
import type { LineString } from 'geojson';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import { useState, useRef, useEffect } from 'react';
import type { MapRef, ViewState } from 'react-map-gl';
import MapGL, { NavigationControl, Source, Layer } from 'react-map-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './ReactMap.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Location {
  lng: number;
  lat: number;
}

interface RouteGeoJSON {
  type: 'Feature';
  properties: object;
  geometry: LineString;
}

interface Viewport {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export function ReactMap() {
  // eslint-disable-next-line no-restricted-syntax
  const mapRef = useRef<MapRef | null>(null);
  // eslint-disable-next-line no-restricted-syntax
  const geocoderContainerRefStart = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line no-restricted-syntax
  const geocoderContainerRefEnd = useRef<HTMLDivElement | null>(null);

  // added because mapRef is not being updated on load of the map
  const [mapLoaded, setMapLoaded] = useState(false);

  const [viewport, setViewport] = useState<Viewport>({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3,
  });

  const [startCoords, setStartCoords] = useState<Location | undefined>(
    undefined,
  );
  const [endCoords, setEndCoords] = useState<Location | undefined>(undefined);
  // eslint-disable-next-line no-restricted-syntax
  const [routeGeoJSON, setRouteGeoJSON] = useState<RouteGeoJSON | null>(null);

  // Initialize the geocoders
  useEffect(() => {
    console.log('Effect running, mapLoaded:', mapLoaded);
    console.log('Effect running, mapRef.current:', mapRef.current);
    if (mapLoaded && mapRef.current) {
      const map = mapRef.current.getMap();

      // Start Location Geocoder
      const geocoderStart = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        placeholder: 'Start Location',
        // @ts-expect-error to avoid type mismatch
        mapboxgl,
      });

      // Destination Geocoder
      const geocoderEnd = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        placeholder: 'Destination',
        // @ts-expect-error to avoid type mismatch
        mapboxgl,
      });

      if (geocoderContainerRefStart.current) {
        geocoderContainerRefStart.current.innerHTML = '';
        geocoderContainerRefStart.current.appendChild(geocoderStart.onAdd(map));
      }

      if (geocoderContainerRefEnd.current) {
        geocoderContainerRefEnd.current.innerHTML = '';
        geocoderContainerRefEnd.current.appendChild(geocoderEnd.onAdd(map));
      }

      geocoderStart.on('result', (e: { result: MapboxGeocoder.Result }) => {
        setStartCoords({ lng: e.result.center[0], lat: e.result.center[1] });
      });

      geocoderEnd.on('result', (e: { result: MapboxGeocoder.Result }) => {
        setEndCoords({ lng: e.result.center[0], lat: e.result.center[1] });
      });
    }
  }, [mapLoaded]); // Use mapLoaded as dependency instead of mapRef.current

  // Fetch and display the route
  useEffect(() => {
    const getRoute = async () => {
      if (startCoords && endCoords) {
        try {
          const response = await axios.get<DirectionsResponse>(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}`,
            {
              params: {
                geometries: 'geojson',
                // eslint-disable-next-line camelcase
                access_token: mapboxgl.accessToken,
              },
            },
          );

          const { data } = response;
          const routeGeometry = data.routes[0].geometry;

          setRouteGeoJSON({
            type: 'Feature',
            properties: {},
            geometry: routeGeometry,
          });

          // Fit map to route bounds
          if (mapRef.current) {
            const map = mapRef.current.getMap();
            const { coordinates } = routeGeometry;
            const bounds = coordinates.reduce(
              (bounds, coord) => bounds.extend(coord as [number, number]),
              new LngLatBounds(
                coordinates[0] as [number, number],
                coordinates[0] as [number, number],
              ),
            );

            map.fitBounds(bounds, { padding: 50 });
          }
        } catch (error) {
          console.error('Error fetching directions:', error);
        }
      }
    };

    void getRoute();
  }, [startCoords, endCoords]);

  // Handle viewport changes
  const handleViewportChange = (newViewport: ViewState) => {
    setViewport(newViewport);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="geocoder"
        id="geocoder-start"
        ref={geocoderContainerRefStart}
      />

      <div
        className="geocoder"
        id="geocoder-end"
        ref={geocoderContainerRefEnd}
      />

      <MapGL
        {...viewport}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={mapboxgl.accessToken}
        onLoad={() => {
          console.log('Map loaded');
          setMapLoaded(true);
        }}
        onMove={(evt) => {
          handleViewportChange(evt.viewState);
        }}
        ref={mapRef}
        style={{ width: '100%', height: '100vh' }}
      >
        <NavigationControl position="top-right" />

        {routeGeoJSON ? (
          <Source data={routeGeoJSON} id="route" type="geojson">
            <Layer
              id="route"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#1db7dd',
                'line-width': 5,
              }}
              source="route"
              type="line"
            />
          </Source>
        ) : undefined}
      </MapGL>
    </div>
  );
}
