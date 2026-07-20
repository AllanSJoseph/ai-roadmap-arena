import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { X, Award, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import styles from './QuizModal.module.css';

export default function QuizModal({ roadmapId, checkpointId, isRetestTrigger = false, onClose, onQuizSuccess }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([null, null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { score, passed, details }
  const [retestLoading, setRetestLoading] = useState(false);

  const fetchQuiz = async (isRetest) => {
    setLoading(true);
    setError('');
    setResult(null);
    setCurrentIndex(0);
    setAnswers([null, null, null, null, null]);
    
    try {
      let data;
      if (isRetest) {
        data = await api.takeRetest(roadmapId, checkpointId);
      } else {
        data = await api.getQuiz(roadmapId, checkpointId);
      }
      setQuestions(data.questions);
    } catch (err) {
      setError(err.message || 'Failed to load quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz(isRetestTrigger);
  }, [roadmapId, checkpointId, isRetestTrigger]);

  const handleSelectOption = (optionIndex) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = optionIndex;
    setAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      setError('Please answer all questions before submitting.');
      return;
    }
    
    setError('');
    setSubmitting(true);

    try {
      const submission = await api.submitQuiz(roadmapId, checkpointId, answers);
      setResult(submission);
      if (submission.passed) {
        onQuizSuccess(); // Triggers roadmap status refresh
      }
    } catch (err) {
      setError(err.message || 'Failed to submit quiz answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerRetest = async () => {
    setRetestLoading(true);
    setError('');
    try {
      await fetchQuiz(true); // Generates a twisted variant quiz
    } catch (err) {
      setError(err.message || 'Failed to trigger retest');
    } finally {
      setRetestLoading(false);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];

  if (loading || retestLoading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={`${styles.modalContent} glass-card flex-center`} style={{ flexDirection: 'column', gap: '20px', padding: '60px' }}>
          <div className={styles.spinner} />
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            {retestLoading ? 'Generating twisted retest questions...' : 'Contacting interviewer for quiz questions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} glass-card`}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        {!result ? (
          <>
            <div className={styles.header}>
              <h3 className={styles.title}>Checkpoint Milestone Quiz</h3>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${((answers.filter(a => a !== null).length) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {error && <div className={styles.errorMsg} style={{
              background: 'var(--error-glow)',
              color: 'var(--error)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.9rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>{error}</div>}

            {questions.length > 0 && (
              <div className={styles.questionBox}>
                <span className={styles.questionNum}>Question {currentIndex + 1} of {questions.length}</span>
                <h4 className={styles.questionText}>{questions[currentIndex].text}</h4>
              </div>
            )}

            {questions.length > 0 && (
              <div className={styles.optionsGrid}>
                {questions[currentIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    className={`${styles.optionBtn} ${answers[currentIndex] === idx ? styles.optionSelected : ''}`}
                    onClick={() => handleSelectOption(idx)}
                  >
                    <span className={styles.optionLetter}>{letters[idx]}</span>
                    <span className={styles.optionText}>{option}</span>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.footer}>
              <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0} 
                className={styles.navBtn}
              >
                <ArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Back
              </button>

              {currentIndex === questions.length - 1 ? (
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting} 
                  className={styles.submitBtn}
                >
                  {submitting ? 'Evaluating...' : 'Submit Answers'}
                </button>
              ) : (
                <button 
                  onClick={handleNext} 
                  disabled={answers[currentIndex] === null} 
                  className={styles.submitBtn}
                >
                  Next
                  <ArrowRight size={16} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.resultsBox}>
            {result.passed ? (
              <>
                <Award className={`${styles.resultsIcon} ${styles.resultsIconSuccess}`} />
                <h2 className={`${styles.resultsTitle} gradient-text`}>Congratulations!</h2>
                <p className={styles.resultsScore}>
                  You achieved a perfect score of <span className={styles.resultsScoreVal}>100%</span>
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                  This checkpoint is completed and successive milestones are now unlocked.
                </p>
                <button onClick={onClose} className={styles.closeResultsBtn} style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', width: '100%' }}>
                  Continue Roadmap
                </button>
              </>
            ) : (
              <>
                <AlertTriangle className={`${styles.resultsIcon} ${styles.resultsIconFailed}`} />
                <h2 className={styles.resultsTitle}>Checkpoint Incomplete</h2>
                <p className={styles.resultsScore}>
                  You scored <span className={styles.resultsScoreVal}>{result.score}%</span>. 100% is required to pass.
                </p>

                <div className={styles.failedDetails}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', fontWeight: '700' }}>Review Incorrect Answers:</h4>
                  {result.details.map((detail, idx) => {
                    if (detail.correct) return null;
                    const question = questions[detail.questionIndex];
                    return (
                      <div key={idx} className={styles.detailQuestion}>
                        <p className={styles.dqText}>{question.text}</p>
                        <div className={styles.dqAnswers}>
                          <span className={styles.dqWrong}>Your Answer: {question.options[detail.userAnswer]}</span>
                          <span className={styles.dqCorrect}>Correct Answer: {question.options[detail.correctAnswer]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.resultsActions}>
                  <button onClick={onClose} className={styles.closeResultsBtn}>
                    Close & Study
                  </button>
                  <button onClick={handleTriggerRetest} className={styles.retestResultsBtn}>
                    <RefreshCw size={16} />
                    Twisted Retest
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
