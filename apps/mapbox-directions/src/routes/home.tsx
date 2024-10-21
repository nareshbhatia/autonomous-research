import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="container relative mx-auto max-w-screen-xl px-8 py-4">
      <ul className="divide-y">
        <li className="flex flex-col py-5">
          <Link className="text-blue-600" to="/mapbox-map">
            MapboxMap
          </Link>
          <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
            A map created using mapbox-gl
          </p>
        </li>
        <li className="flex flex-col py-5">
          <Link className="text-blue-600" to="/react-map">
            ReactMap
          </Link>
          <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
            A map created using react-map-gl
          </p>
        </li>
        <li className="flex flex-col py-5">
          <Link className="text-blue-600" to="/react-map-buggy">
            ReactMapBuggy
          </Link>
          <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
            A buggy implementation of that does not update mapRef
          </p>
        </li>
      </ul>
    </div>
  );
}
