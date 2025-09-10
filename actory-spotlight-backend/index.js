import 'dotenv/config';
import express from 'express';
import routes from './routes.js';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/actory-spotlight';

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// API routes
app.use('/api', routes);

// MongoDB connection
let db;
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    db = client.db();
    app.locals.db = db;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Connected to MongoDB');
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
