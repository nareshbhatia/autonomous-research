export interface Vehicle {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface LocationUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  timestamp: number;
}
