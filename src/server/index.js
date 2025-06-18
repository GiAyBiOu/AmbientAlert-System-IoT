import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicPath = join(__dirname, '..', 'public');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection string from your Docker setup
const mongoUrl = 'mongodb://admin:password123@localhost:27017/';
const dbName = 'iot_data';
const collectionName = 'sensor_data';

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(publicPath));

let db;

// Connect to MongoDB
MongoClient.connect(mongoUrl)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
    });

// API Routes
app.post('/api/sensor-data', async (req, res) => {
    try {
        const sensorData = {
            ...req.body,
            timestamp: new Date()
        };

        await db.collection(collectionName).insertOne(sensorData);
        res.status(201).json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving sensor data:', error);
        res.status(500).json({ error: 'Failed to save sensor data' });
    }
});

app.get('/api/sensor-data', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

        const data = await db.collection(collectionName)
            .find({
                timestamp: { $gte: cutoffTime }
            })
            .sort({ timestamp: 1 })
            .toArray();

        res.json(data);
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ error: 'Failed to fetch sensor data' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(join(publicPath, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 