
import Redis from "ioredis";
import { redisUrl } from "../constants.js";

const redis = new Redis(redisUrl || "redis://redis:6379");

redis.on('connect', () => {
  console.log('Connected to Redis!');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;