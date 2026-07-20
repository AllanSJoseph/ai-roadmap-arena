import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { generateQuiz, generateRetest } from '../services/geminiService.js';
import { getRoadmapById } from '../db/roadmapModel.js';
import {
  createPendingQuizSession,
  getPendingQuizSession,
  submitQuizSession,
  getLatestCompletedQuiz,
  updateProgress,
  getSpecificCheckpointProgress,
  getRoadmapProgress
} from '../db/roadmapModel.js';

const router = express.Router();

// Helper to filter out correct answers before sending to client
const sanitizeQuestionsForClient = (questions) => {
  return questions.map(q => ({
    id: q.id,
    text: q.text,
    options: q.options
  }));
};

/**
 * 1. GET OR GENERATE QUIZ FOR CHECKPOINT
 */
router.post('/roadmaps/:id/checkpoints/:checkpointId/quiz', verifyToken, async (req, res) => {
  const roadmapId = req.params.id;
  const checkpointId = req.params.checkpointId;
  const userId = req.user.id;

  try {
    // 1. Verify roadmap belongs to user
    const roadmap = await getRoadmapById(roadmapId, userId);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    // 2. Find checkpoint details inside roadmap
    const checkpoints = roadmap.checkpoints;
    const checkpoint = checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found in this roadmap.' });
    }

    // 3. Verify checkpoint is not locked (must be 'in_progress' or 'completed' to take quiz)
    const progress = await getSpecificCheckpointProgress(roadmapId, checkpointId);
    if (!progress || progress.status === 'locked') {
      return res.status(403).json({ error: 'This checkpoint is locked. Please complete the previous checkpoints first.' });
    }

    // 4. Check if there is already an active pending quiz session
    let pendingSession = await getPendingQuizSession(roadmapId, checkpointId);
    
    if (pendingSession) {
      return res.status(200).json({
        quizId: pendingSession.id,
        questions: sanitizeQuestionsForClient(pendingSession.questions)
      });
    }

    // 5. No pending quiz, generate a new one using Gemini
    console.log(`Generating quiz for checkpoint: ${checkpoint.title}...`);
    const quizData = await generateQuiz(
      checkpoint.title,
      checkpoint.description,
      checkpoint.topics,
      roadmap.user_context
    );

    if (!quizData.questions || quizData.questions.length === 0) {
      return res.status(500).json({ error: 'AI failed to generate quiz questions.' });
    }

    // 6. Save as pending quiz session (score = -1)
    pendingSession = await createPendingQuizSession(roadmapId, checkpointId, quizData.questions);

    return res.status(200).json({
      quizId: pendingSession.id,
      questions: sanitizeQuestionsForClient(pendingSession.questions)
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * 2. SUBMIT QUIZ ANSWERS
 */
router.post('/quiz/submit', verifyToken, async (req, res) => {
  const { roadmapId, checkpointId, userAnswers } = req.body;
  const userId = req.user.id;

  if (!roadmapId || !checkpointId || !userAnswers || !Array.isArray(userAnswers)) {
    return res.status(400).json({ error: 'All fields (roadmapId, checkpointId, userAnswers) are required.' });
  }

  try {
    // 1. Verify roadmap belongs to user
    const roadmap = await getRoadmapById(roadmapId, userId);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    // 2. Fetch active pending session
    const pendingSession = await getPendingQuizSession(roadmapId, checkpointId);
    if (!pendingSession) {
      return res.status(400).json({ error: 'No active quiz session found for this checkpoint. Please start a quiz first.' });
    }

    const quizQuestions = pendingSession.questions;
    if (userAnswers.length !== quizQuestions.length) {
      return res.status(400).json({ error: `Please provide exactly ${quizQuestions.length} answers.` });
    }

    // 3. Evaluate answers
    let correctCount = 0;
    const details = quizQuestions.map((question, index) => {
      const userAnswerIndex = userAnswers[index];
      const correctIndex = question.correct_answer_index;
      const isCorrect = userAnswerIndex === correctIndex;
      
      if (isCorrect) correctCount++;
      
      return {
        questionIndex: index,
        correct: isCorrect,
        userAnswer: userAnswerIndex,
        correctAnswer: correctIndex
      };
    });

    const score = Math.round((correctCount / quizQuestions.length) * 100);
    const passed = score === 100;

    // 4. Update the quiz session with submission
    await submitQuizSession(pendingSession.id, userAnswers, score);

    // 5. Update progress table and increment attempt
    const newStatus = passed ? 'completed' : 'in_progress';
    await updateProgress(roadmapId, checkpointId, newStatus, score, true);

    // 6. If passed, unlock next checkpoint
    if (passed) {
      const checkpoints = roadmap.checkpoints;
      const currentIndex = checkpoints.findIndex(cp => cp.id === checkpointId);
      
      if (currentIndex !== -1 && currentIndex + 1 < checkpoints.length) {
        const nextCheckpoint = checkpoints[currentIndex + 1];
        
        // Fetch current status of next checkpoint
        const nextProgress = await getSpecificCheckpointProgress(roadmapId, nextCheckpoint.id);
        
        if (!nextProgress || nextProgress.status === 'locked') {
          await updateProgress(roadmapId, nextCheckpoint.id, 'in_progress', 0, false);
          console.log(`Unlocked next checkpoint: ${nextCheckpoint.title}`);
        }
      }
    }

    return res.status(200).json({
      score,
      passed,
      details
    });
  } catch (error) {
    console.error('Error submitting quiz answers:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * 3. GENERATE TWISTED RETEST
 */
router.post('/roadmaps/:id/checkpoints/:checkpointId/retest', verifyToken, async (req, res) => {
  const roadmapId = req.params.id;
  const checkpointId = req.params.checkpointId;
  const userId = req.user.id;

  try {
    // 1. Verify roadmap belongs to user
    const roadmap = await getRoadmapById(roadmapId, userId);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const checkpoints = roadmap.checkpoints;
    const checkpoint = checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found.' });
    }

    // 2. Clean up any existing active pending session (if they abandon a retest midway and ask for another, or similar)
    const existingPending = await getPendingQuizSession(roadmapId, checkpointId);
    if (existingPending) {
      // Just mark it as cancelled/failed by setting score = 0, or delete it, or overwrite
      await submitQuizSession(existingPending.id, [], 0);
    }

    // 3. Fetch the latest completed failed quiz attempt
    const latestCompleted = await getLatestCompletedQuiz(roadmapId, checkpointId);
    if (!latestCompleted) {
      return res.status(400).json({ error: 'No previous quiz completion found. You must attempt the standard quiz first before requesting a retest.' });
    }

    if (latestCompleted.score === 100) {
      return res.status(400).json({ error: 'You have already passed this checkpoint quiz with 100%! No need to retest.' });
    }

    console.log(`Generating twisted retest for checkpoint: ${checkpoint.title}...`);
    // 4. Call Gemini to generate twisted questions based on the previous attempt
    const quizData = await generateRetest(
      checkpoint.title,
      checkpoint.topics,
      latestCompleted.questions,
      latestCompleted.user_answers
    );

    if (!quizData.questions || quizData.questions.length === 0) {
      return res.status(500).json({ error: 'AI failed to generate twisted retest questions.' });
    }

    // 5. Save as a new pending quiz session
    const pendingSession = await createPendingQuizSession(roadmapId, checkpointId, quizData.questions);

    return res.status(200).json({
      quizId: pendingSession.id,
      questions: sanitizeQuestionsForClient(pendingSession.questions)
    });
  } catch (error) {
    console.error('Error generating retest:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;
