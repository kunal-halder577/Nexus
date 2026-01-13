import app from './app.js';
import { connectDB } from './database/config.js';

connectDB()
.catch((err) => {
  throw new Error(err.message || 'db connection failed');
});

app.listen(3000, () => {
  console.log(`Server is listening at ${3000}`);
});
