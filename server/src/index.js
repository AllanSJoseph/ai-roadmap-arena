import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for cross-origin frontend communication
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api', quizRoutes); // Mounts /api/roadmaps/:id/... and /api/quiz/submit

// Server Status Health Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AI Roadmap Generator Backend is running.' });
});

// Start listening for connections
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});
