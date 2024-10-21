import { HomePage } from './routes/home';
import { MapboxMapPage } from './routes/mapbox-map';
import { ReactMapPage } from './routes/react-map';
import { ReactMapBuggyPage } from './routes/react-map-buggy';

import { RootLayout } from './routes/root';
import type { RouteObject } from 'react-router-dom';

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/mapbox-map',
        element: <MapboxMapPage />,
      },
      {
        path: '/react-map',
        element: <ReactMapPage />,
      },
      {
        path: '/react-map-buggy',
        element: <ReactMapBuggyPage />,
      },
    ],
  },
];
