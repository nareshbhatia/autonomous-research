import { Router } from 'express';
import { createClient as createRedisClient } from 'redis';

const redisUrl = process.env.REDIS_URL ?? 'redis://redis-server:6379';
const redisChannel =
  process.env.REDIS_VEHICLE_EVENTS_CHANNEL ?? 'vehicle-events';

export const vehiclesRouter = Router();

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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
vehiclesRouter.post('/:id/event', async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const vehicleEvent = req.body;

  try {
    // Publish vehicleEvent to Redis
    await redisPublisher.publish(redisChannel, JSON.stringify(vehicleEvent));
    res
      .status(200)
      .json({ message: 'Vehicle event received and published successfully' });
  } catch (error) {
    console.error('Error publishing to Redis:', error);
    res.status(500).json({ message: 'Error processing vehicle event' });
  }
});
