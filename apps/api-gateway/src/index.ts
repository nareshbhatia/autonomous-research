import { createClient as createRedisClient } from 'redis';
import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT) || 8080;
const redisUrl = process.env.REDIS_URL ?? 'redis://redis-server:6379';
const redisChannel =
  process.env.REDIS_LOCATION_UPDATES_CHANNEL ?? 'location-updates';

const sockets = new Map<number, WebSocket>();
let nextId = 1;

async function main() {
  // Create webSocketServer
  const webSocketServer = new WebSocketServer({ port });
  console.log(`api-gateway: listening on port ${port}`);

  // Create Redis subscriber
  const redisSubscriber = createRedisClient({
    url: redisUrl,
  });

  // Set Redis error handler
  redisSubscriber.on('error', (err) => {
    console.log(`api-gateway: redis subscriber error:`, err);
  });

  // Connect to Redis
  await redisSubscriber.connect();

  // Subscribe to CHAT_CHANNEL on Redis
  await redisSubscriber.subscribe(redisChannel, (message) => {
    try {
      [...sockets.values()].forEach((socket) => {
        socket.send(message);
      });
    } catch (error) {
      console.log(`api-gateway: error:`, error);
    }
  });
  console.log(`api-gateway: subscribed successfully to ${redisChannel}`);

  // Accept websocket connection requests
  webSocketServer.on('connection', (ws: WebSocket) => {
    const socketId = nextId++;
    sockets.set(socketId, ws);
    console.log(`api-gateway: Socket ${socketId} created`);
    console.log(`api-gateway: Total sockets: ${sockets.size}`);

    // @ts-expect-error: ws.on may not have type definitions
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ws.on('close', () => {
      console.log(`api-gateway: Socket ${socketId} closed`);
      sockets.delete(socketId);
      console.log(`api-gateway: Total sockets: ${sockets.size}`);
    });
  });
}

void main();
