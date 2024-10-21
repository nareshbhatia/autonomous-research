import type { DirectionsResponse } from '@/types/MapboxDirections';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import axios from 'axios';
import type { Map } from 'mapbox-gl';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import { useRef, useEffect, useState } from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './MapboxMap.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Location {
  lng: number;
  lat: number;
}

export function MapboxMap() {
  // eslint-disable-next-line no-restricted-syntax
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | undefined>(undefined);
  const [startCoords, setStartCoords] = useState<Location | undefined>(
    undefined,
  );
  const [endCoords, setEndCoords] = useState<Location | undefined>(undefined);

  useEffect(() => {
    if (mapContainer.current && !map) {
      // eslint-disable-next-line import/no-named-as-default-member
      const initializeMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98.5795, 39.8283], // Center of the USA
        zoom: 3,
      });

      // eslint-disable-next-line import/no-named-as-default-member
      initializeMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      setMap(initializeMap);
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      const geocoderStart = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        placeholder: 'Start Location',
        // @ts-expect-error to avoid type mismatch
        mapboxgl,
      });

      const geocoderEnd = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        placeholder: 'Destination',
        // @ts-expect-error to avoid type mismatch
        mapboxgl,
      });

      // Position geocoder controls
      document
        .getElementById('geocoder-start')
        ?.appendChild(geocoderStart.onAdd(map));
      document
        .getElementById('geocoder-end')
        ?.appendChild(geocoderEnd.onAdd(map));

      geocoderStart.on('result', (e: { result: MapboxGeocoder.Result }) => {
        setStartCoords({ lng: e.result.center[0], lat: e.result.center[1] });
      });

      geocoderEnd.on('result', (e: { result: MapboxGeocoder.Result }) => {
        setEndCoords({ lng: e.result.center[0], lat: e.result.center[1] });
      });
    }
  }, [map]);

  useEffect(() => {
    if (startCoords && endCoords && map) {
      const getRoute = async () => {
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

        // Remove existing route if any
        if (map.getSource('route')) {
          map.removeLayer('route');
          map.removeSource('route');
        }

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeGeometry,
          },
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#1db7dd',
            'line-width': 5,
          },
        });

        // Fit map to route bounds
        const { coordinates } = routeGeometry;
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord as [number, number]),
          new LngLatBounds(
            coordinates[0] as [number, number],
            coordinates[0] as [number, number],
          ),
        );

        map.fitBounds(bounds, { padding: 50 });
      };

      void getRoute();
    }
  }, [startCoords, endCoords, map]);

  return (
    <div>
      <div className="geocoder" id="geocoder-start" />
      <div className="geocoder" id="geocoder-end" />
      <div className="map-container" ref={mapContainer} />
    </div>
  );
}
