import * as Cesium from 'cesium';
import { useEffect, useRef } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// @ts-expect-error to avoid type mismatch
window.CESIUM_BASE_URL = '/Cesium';

Cesium.Ion.defaultAccessToken = import.meta.env
  .VITE_CESIUM_ACCESS_TOKEN as string;

export function HomePage() {
  // eslint-disable-next-line no-restricted-syntax
  const cesiumContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    let viewer: Cesium.Viewer | undefined;

    // Need to create async function since useEffect callback cannot be async directly
    const initViewer = async () => {
      if (!cesiumContainer.current) return;

      viewer = new Cesium.Viewer(cesiumContainer.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
      });

      const osmBuildings = await Cesium.createOsmBuildingsAsync();
      viewer.scene.primitives.add(osmBuildings);

      // Set view to slightly outside Boston, overlooking the Zakim Bridge
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-71.0499, 42.3751, 325),
        orientation: {
          heading: Cesium.Math.toRadians(235.1307),
          pitch: Cesium.Math.toRadians(-16.5481),
          roll: Cesium.Math.toRadians(0),
        },
      });

      // Log camera position, heading, pitch, and roll when the camera movement ends
      viewer.camera.moveEnd.addEventListener(() => {
        if (!viewer) return;
        const { position, heading, pitch, roll } = viewer.camera;
        const cartographic = Cesium.Cartographic.fromCartesian(position);

        const longitudeDegrees = Cesium.Math.toDegrees(cartographic.longitude);
        const latitudeDegrees = Cesium.Math.toDegrees(cartographic.latitude);
        const heightMeters = cartographic.height;
        const headingDegrees = Cesium.Math.toDegrees(heading);
        const pitchDegrees = Cesium.Math.toDegrees(pitch);
        const rollDegrees = Cesium.Math.toDegrees(roll);

        console.log('longitude', longitudeDegrees);
        console.log('latitude', latitudeDegrees);
        console.log('height', heightMeters, 'meters');
        console.log('heading', headingDegrees);
        console.log('pitch', pitchDegrees);
        console.log('roll', rollDegrees);
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

  return <div ref={cesiumContainer} />;
}
