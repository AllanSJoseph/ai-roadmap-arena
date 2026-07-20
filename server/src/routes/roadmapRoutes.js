import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { generateRoadmap } from '../services/geminiService.js';
import {
  createRoadmap,
  initializeProgress,
  getUserRoadmaps,
  getRoadmapById,
  getRoadmapProgress
} from '../db/roadmapModel.js';

const router = express.Router();

// 1. Generate new roadmap
router.post('/', verifyToken, async (req, res) => {
  const { role, experience_level, context, specializations } = req.body;
  const userId = req.user.id;

  if (!role || !experience_level || !context || !specializations || !Array.isArray(specializations)) {
    return res.status(400).json({ error: 'All fields (role, experience_level, context, specializations) are required.' });
  }

  try {
    // Generate checkpoints via Gemini Service
    const aiData = await generateRoadmap(role, experience_level, context, specializations);
    const checkpoints = aiData.checkpoints;

    if (!checkpoints || checkpoints.length === 0) {
      return res.status(500).json({ error: 'Failed to generate checkpoints from AI model.' });
    }

    // Save roadmap in DB
    const roadmap = await createRoadmap(userId, role, experience_level, context, specializations, checkpoints);
    
    // Initialize progress for each checkpoint
    const checkpointIds = checkpoints.map(cp => cp.id);
    await initializeProgress(roadmap.id, checkpointIds);

    return res.status(201).json(roadmap);
  } catch (error) {
    console.error('Error generating/saving roadmap:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

// 2. Fetch all roadmaps for user
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const roadmaps = await getUserRoadmaps(userId);
    return res.status(200).json(roadmaps);
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. Fetch single roadmap by id (including progress details)
router.get('/:id', verifyToken, async (req, res) => {
  const roadmapId = req.params.id;
  const userId = req.user.id;

  try {
    const roadmap = await getRoadmapById(roadmapId, userId);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const progress = await getRoadmapProgress(roadmapId);
    return res.status(200).json({ roadmap, progress });
  } catch (error) {
    console.error('Error fetching single roadmap:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
