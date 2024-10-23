import { Router } from 'express';
import { createClient as createRedisClient } from 'redis';

const redisUrl = process.env.REDIS_URL ?? 'redis://redis-server:6379';
const redisChannel =
  process.env.REDIS_LOCATION_UPDATES_CHANNEL ?? 'location-updates';

export const locationUpdateRouter = Router();

// Create Redis publisher
const redisPublisher = createRedisClient({
  url: redisUrl,
});

// Set Redis error handler
redisPublisher.on('error', (err) => {
  console.log(`vehicle-events: redis publisher error:`, err);
});

// Connect to Redis
redisPublisher.connect().catch(console.error);

/** post location updates from vehicles */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
locationUpdateRouter.post('/', async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const locationUpdate = req.body;

  try {
    // Publish locationUpdate to Redis
    await redisPublisher.publish(redisChannel, JSON.stringify(locationUpdate));
    res
      .status(200)
      .json({ message: 'Location update received and published successfully' });
  } catch (error) {
    console.error('Error publishing to Redis:', error);
    res.status(500).json({ message: 'Error processing location update' });
  }
});
