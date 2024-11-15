import {
  Cartesian3,
  createOsmBuildingsAsync,
  Ion,
  Math as CesiumMath,
  Terrain,
  Viewer,
} from 'cesium';
import { useEffect, useRef } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

window.CESIUM_BASE_URL = '/Cesium';

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ACCESS_TOKEN as string;

export function HomePage() {
  // eslint-disable-next-line no-restricted-syntax
  const cesiumContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    let viewer: Viewer | undefined;

    // Need to create async function since useEffect callback cannot be async directly
    const initViewer = async () => {
      if (!cesiumContainer.current) return;

      console.log('initViewer');
      viewer = new Viewer('cesiumContainer', {
        terrain: Terrain.fromWorldTerrain(),
      });

      const osmBuildings = await createOsmBuildingsAsync();
      viewer.scene.primitives.add(osmBuildings);

      // Set view to Boston coordinates (approximate center)
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(-71.0589, 42.3601, 15000),
        orientation: {
          heading: CesiumMath.toRadians(0.0),
          pitch: CesiumMath.toRadians(-15.0),
        },
      });
    };

    void initViewer();

    // eslint-disable-next-line consistent-return
    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };
  }, []);

  return <div id="cesiumContainer" ref={cesiumContainer} />;
}
