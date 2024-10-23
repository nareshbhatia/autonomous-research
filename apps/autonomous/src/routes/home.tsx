import type { Map } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import { useRef, useEffect, useState } from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxMap.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export function HomePage() {
  // eslint-disable-next-line no-restricted-syntax
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | undefined>(undefined);

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

  return (
    <div>
      <div className="map-container" ref={mapContainer} />
    </div>
  );
}
