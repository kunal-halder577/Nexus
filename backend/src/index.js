import "./docker-dns-fix.js";
import dotenv from "dotenv/config";
import app from './app.js';
import { connectDB } from './database/config.js';
import { startCronJob } from "./jobs/cleanUpLikes.js";
import redis from "./cache/redisConfig.js";

connectDB()
  .then(async () => {
    await redis.ping();
    
    startCronJob();
        
    app.listen(3000, () => {
      console.log(`Server is listening at ${3000}`);
    });
  })
  .catch((err) => {
    throw new Error(err.message || 'db connection failed');
  });
