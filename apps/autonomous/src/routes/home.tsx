import type { LocationUpdate, Vehicle } from '@/models';
import type { Map } from 'mapbox-gl';
import mapboxgl, { Marker } from 'mapbox-gl';
import { useCallback, useRef, useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxMap.css';

const apiUrl =
  (import.meta.env.VITE_API_URL as string) || 'ws://localhost:8080';
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export function HomePage() {
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});

  const handleLocationUpdate = useCallback((newLocation: LocationUpdate) => {
    setVehicles((prev) => ({
      ...prev,
      [newLocation.vehicleId]: {
        ...prev[newLocation.vehicleId],
        id: newLocation.vehicleId,
        location: {
          lat: newLocation.lat,
          lng: newLocation.lng,
        },
      },
    }));
  }, []);

  const { readyState } = useWebSocket(apiUrl, {
    onMessage: (event) => {
      try {
        const locationUpdate = JSON.parse(
          event.data as string,
        ) as LocationUpdate;
        handleLocationUpdate(locationUpdate);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    },
    onError: (event) => {
      console.error('WebSocket error:', event);
    },
    // Attempt to reconnect on connection loss
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 5,
    // Share WebSocket instance between components
    share: true,
    // Optional heartbeat to ensure connection stays active
    heartbeat: {
      message: JSON.stringify({ type: 'PING' }),
      interval: 30000,
    },
  });

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const isConnected = readyState === ReadyState.OPEN;

  // eslint-disable-next-line no-restricted-syntax
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | undefined>(undefined);

  // Markers should persist across renders
  const markers = useRef<Record<string, mapboxgl.Marker>>({});

  useEffect(() => {
    if (mapContainer.current && !map) {
      // eslint-disable-next-line import/no-named-as-default-member
      const initializeMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-122.45, 37.75], // Center of San Francisco
        zoom: 12, // Adjusted zoom level for a closer view of San Francisco
      });

      // eslint-disable-next-line import/no-named-as-default-member
      initializeMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      setMap(initializeMap);
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      // Update markers whenever vehicles change
      Object.values(vehicles).forEach((vehicle) => {
        const { id, location } = vehicle;

        if (markers.current[id] === undefined) {
          // Create a new marker if it doesn't exist
          markers.current[id] = new Marker()
            .setLngLat([location.lng, location.lat])
            .addTo(map);
        } else {
          // Update the marker's position if it already exists
          markers.current[id].setLngLat([location.lng, location.lat]);
        }
      });
    }
  }, [map, vehicles]);

  return (
    <div>
      <div className="map-container" ref={mapContainer} />
      <div hidden>
        <div className="mb-4">
          Connection Status:
          <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
            {connectionStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(vehicles).map((vehicle) => (
            <div className="rounded border p-4" key={vehicle.id}>
              <h3 className="font-bold">{vehicle.id}</h3>
              <p>
                {vehicle.location.lat.toFixed(6)},
                {vehicle.location.lng.toFixed(6)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
