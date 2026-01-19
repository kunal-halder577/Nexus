import dotenv from "dotenv/config";
import app from './app.js';
import { connectDB } from './database/config.js';

connectDB()
.then(() => {
  app.listen(3000, () => {
    console.log(`Server is listening at ${3000}`);
  });
})
.catch((err) => {
  throw new Error(err.message || 'db connection failed');
});
