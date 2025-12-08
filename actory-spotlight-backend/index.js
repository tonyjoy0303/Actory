import express from 'express';
import routes from './routes.js';
import predictionRoutes from './routes/prediction.js';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/actory-spotlight';

app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Prediction routes
app.use('/api', predictionRoutes);

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
