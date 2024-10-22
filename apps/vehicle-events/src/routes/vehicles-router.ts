import { Router } from 'express';
import { createClient } from 'redis';

interface LocationUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export const vehiclesRouter = Router();

// Create Redis client
const redisClient = createClient();

// Connect to Redis
redisClient.connect().catch(console.error);

/** post location update from a vehicle */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
vehiclesRouter.post('/location-update', async (req, res) => {
  const locationUpdate: LocationUpdate = req.body as LocationUpdate;

  try {
    // Publish locationUpdate to Redis
    await redisClient.publish(
      'location-updates',
      JSON.stringify(locationUpdate),
    );
    res
      .status(200)
      .json({ message: 'Location update received and published successfully' });
  } catch (error) {
    console.error('Error publishing to Redis:', error);
    res.status(500).json({ message: 'Error processing location update' });
  }
});
