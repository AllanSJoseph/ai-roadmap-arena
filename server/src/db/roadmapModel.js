import pool from '../config/db.js';

export const createRoadmap = async (userId, role, experienceLevel, context, specializations, checkpoints) => {
  const result = await pool.query(
    'INSERT INTO roadmaps (user_id, role, experience_level, user_context, specializations, checkpoints) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [userId, role, experienceLevel, context, specializations, JSON.stringify(checkpoints)]
  );
  return result.rows[0];
};

export const getUserRoadmaps = async (userId) => {
  const result = await pool.query(
    'SELECT id, role, experience_level, specializations, created_at FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

export const getRoadmapById = async (id, userId) => {
  const result = await pool.query(
    'SELECT * FROM roadmaps WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0];
};

export const initializeProgress = async (roadmapId, checkpointIds) => {
  // The first checkpoint starts as 'in_progress', and all subsequent ones are 'locked'
  const queries = checkpointIds.map((cpId, index) => {
    const status = index === 0 ? 'in_progress' : 'locked';
    return pool.query(
      'INSERT INTO roadmap_progress (roadmap_id, checkpoint_id, status) VALUES ($1, $2, $3) ON CONFLICT (roadmap_id, checkpoint_id) DO NOTHING',
      [roadmapId, cpId, status]
    );
  });
  await Promise.all(queries);
};

export const getRoadmapProgress = async (roadmapId) => {
  const result = await pool.query(
    'SELECT checkpoint_id, status, best_score, attempts_count, completed_at FROM roadmap_progress WHERE roadmap_id = $1',
    [roadmapId]
  );
  return result.rows;
};

export const updateProgress = async (roadmapId, checkpointId, status, bestScore, incrementAttempt = false) => {
  const attemptIncrementQuery = incrementAttempt ? 'attempts_count = roadmap_progress.attempts_count + 1,' : '';
  const completedAtQuery = status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP,' : '';

  const queryText = `
    INSERT INTO roadmap_progress (roadmap_id, checkpoint_id, status, best_score, attempts_count, completed_at)
    VALUES ($1, $2, $3, $4, ${incrementAttempt ? 1 : 0}, ${status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL'})
    ON CONFLICT (roadmap_id, checkpoint_id) DO UPDATE SET
      ${attemptIncrementQuery}
      ${completedAtQuery}
      status = EXCLUDED.status,
      best_score = GREATEST(roadmap_progress.best_score, EXCLUDED.best_score)
    RETURNING *
  `;
  const result = await pool.query(queryText, [roadmapId, checkpointId, status, bestScore]);
  return result.rows[0];
};

export const getSpecificCheckpointProgress = async (roadmapId, checkpointId) => {
  const result = await pool.query(
    'SELECT * FROM roadmap_progress WHERE roadmap_id = $1 AND checkpoint_id = $2',
    [roadmapId, checkpointId]
  );
  return result.rows[0];
};

export const createPendingQuizSession = async (roadmapId, checkpointId, questions) => {
  const result = await pool.query(
    'INSERT INTO quiz_history (roadmap_id, checkpoint_id, questions, user_answers, score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [roadmapId, checkpointId, JSON.stringify(questions), JSON.stringify([]), -1]
  );
  return result.rows[0];
};

export const getPendingQuizSession = async (roadmapId, checkpointId) => {
  const result = await pool.query(
    'SELECT * FROM quiz_history WHERE roadmap_id = $1 AND checkpoint_id = $2 AND score = -1 ORDER BY created_at DESC LIMIT 1',
    [roadmapId, checkpointId]
  );
  return result.rows[0];
};

export const submitQuizSession = async (quizHistoryId, userAnswers, score) => {
  const result = await pool.query(
    'UPDATE quiz_history SET user_answers = $1, score = $2 WHERE id = $3 RETURNING *',
    [JSON.stringify(userAnswers), score, quizHistoryId]
  );
  return result.rows[0];
};

export const getLatestCompletedQuiz = async (roadmapId, checkpointId) => {
  const result = await pool.query(
    'SELECT * FROM quiz_history WHERE roadmap_id = $1 AND checkpoint_id = $2 AND score >= 0 ORDER BY created_at DESC LIMIT 1',
    [roadmapId, checkpointId]
  );
  return result.rows[0];
};

export const getLatestQuizHistory = async (roadmapId, checkpointId) => {
  const result = await pool.query(
    'SELECT * FROM quiz_history WHERE roadmap_id = $1 AND checkpoint_id = $2 ORDER BY created_at DESC LIMIT 1',
    [roadmapId, checkpointId]
  );
  return result.rows[0];
};
