import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { ArrowLeft, Clock, BookOpen, Lock, CheckCircle2, ChevronRight, Play, RefreshCw } from 'lucide-react';
import QuizModal from '../components/QuizModal.jsx';
import styles from './RoadmapDashboard.module.css';

export default function RoadmapDashboard() {
  const { id: roadmapId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedCpId, setSelectedCpId] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [retestTrigger, setRetestTrigger] = useState(false);

  // Fetch roadmap and its checkpoint status progress
  const fetchRoadmapData = async () => {
    try {
      const data = await api.getRoadmap(roadmapId);
      setRoadmap(data.roadmap);
      setProgress(data.progress);
      
      // Auto-select the first checkpoint on load
      if (data.roadmap.checkpoints.length > 0 && !selectedCpId) {
        setSelectedCpId(data.roadmap.checkpoints[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch roadmap details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRoadmapData();
    }
  }, [roadmapId, user]);

  const handleQuizSuccess = () => {
    fetchRoadmapData();
  };

  if (authLoading || loading) {
    return (
      <div className={styles.roadmapContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className={`${styles.roadmapContainer} container`}>
        <Link to="/dashboard" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--error)' }}>Error Loading Roadmap</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>{error || 'Roadmap not found.'}</p>
        </div>
      </div>
    );
  }

  const getCpProgress = (cpId) => {
    const p = progress.find(item => item.checkpoint_id === cpId);
    return p || { status: 'locked', best_score: 0, attempts_count: 0 };
  };

  const selectedCheckpoint = roadmap.checkpoints.find(cp => cp.id === selectedCpId);
  const selectedProgress = selectedCheckpoint ? getCpProgress(selectedCheckpoint.id) : null;

  return (
    <div className={`${styles.roadmapContainer} container`}>
      <Link to="/dashboard" className={styles.backLink}>
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </Link>

      {/* Header Summary */}
      <div className={`${styles.headerCard} glass-card`}>
        <h1 className={`${styles.roleTitle} gradient-text`}>{roadmap.role} Pathway</h1>
        <div className={styles.metaRow}>
          <span>Experience Level: <strong>{roadmap.experience_level}</strong></span>
          <span>Generated On: <strong>{new Date(roadmap.created_at).toLocaleDateString()}</strong></span>
        </div>
        <p className={styles.contextBlock}>
          <strong>Your Context:</strong> {roadmap.user_context}
        </p>
      </div>

      {/* Split details view */}
      <div className={styles.layout}>
        {/* Checkpoint Nodes Timeline */}
        <div className={`${styles.timelineCard} glass-card`}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '24px' }}>Path Milestones</h2>
          <div className={styles.timeline}>
            {roadmap.checkpoints.map((cp) => {
              const prog = getCpProgress(cp.id);
              const isSelected = cp.id === selectedCpId;
              
              let statusClass = styles.nodeLocked;
              if (prog.status === 'in_progress') statusClass = styles.nodeActive;
              if (prog.status === 'completed') statusClass = styles.nodeCompleted;
              
              return (
                <div
                  key={cp.id}
                  className={`${styles.node} ${statusClass} ${isSelected ? styles.nodeSelected : ''}`}
                  onClick={() => setSelectedCpId(cp.id)}
                >
                  <div className={styles.nodeDot}>
                    {prog.status === 'completed' ? (
                      <CheckCircle2 size={16} />
                    ) : prog.status === 'locked' ? (
                      <Lock size={12} style={{ opacity: 0.6 }} />
                    ) : (
                      <Play size={12} style={{ color: 'var(--accent-primary)', marginLeft: '2.5px' }} />
                    )}
                  </div>
                  
                  <div className={styles.nodeContent}>
                    <h3 className={styles.nodeTitle}>{cp.title}</h3>
                    <p className={styles.nodeDesc}>{cp.description}</p>
                    
                    <span className={`${styles.badge} ${
                      prog.status === 'completed' ? styles.badgeCompleted :
                      prog.status === 'in_progress' ? styles.badgeInProgress :
                      styles.badgeLocked
                    }`}>
                      {prog.status === 'completed' ? 'Completed 100%' :
                       prog.status === 'in_progress' ? 'Active Step' : 'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Checkpoint Detail Cards */}
        <div className={`${styles.detailsCard} glass-card`}>
          {selectedCheckpoint ? (
            <>
              <h2 className={styles.detailTitle}>{selectedCheckpoint.title}</h2>
              <div className={styles.hoursBlock}>
                <Clock size={16} />
                <span>Estimated Time: <strong>{selectedCheckpoint.estimated_hours} Hours</strong></span>
              </div>
              
              <p className={styles.detailDesc}>{selectedCheckpoint.description}</p>

              <h3 className={styles.sectionTitle}>Topics Covered</h3>
              <div className={styles.topicsList}>
                {selectedCheckpoint.topics.map(topic => (
                  <span key={topic} className={styles.topicTag}>{topic}</span>
                ))}
              </div>

              <h3 className={styles.sectionTitle}>Recommended Resources</h3>
              <div className={styles.resourceList}>
                {selectedCheckpoint.resources.map((res, index) => (
                  <a
                    key={index}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resourceLink}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
                      {res.title}
                    </span>
                    <ChevronRight size={16} style={{ opacity: 0.6 }} />
                  </a>
                ))}
              </div>

              <div className={styles.actionBox}>
                {selectedProgress.status === 'completed' ? (
                  <div className={styles.quizStatusBox}>
                    <CheckCircle2 size={20} />
                    <span>Checkpoint completed! Ready for the next node.</span>
                    <span className={styles.scoreBadge}>100% Score</span>
                  </div>
                ) : selectedProgress.status === 'locked' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <Lock size={16} />
                    <span>Complete previous milestones to unlock quiz.</span>
                  </div>
                ) : (
                  <>
                    {selectedProgress.attempts_count > 0 && (
                      <div className={styles.scoreBanner}>
                        <span>Best Quiz Score:</span>
                        <span className={styles.scoreBannerScore}>{selectedProgress.best_score}%</span>
                      </div>
                    )}
                    
                    {selectedProgress.attempts_count > 0 ? (
                      <button
                        onClick={() => {
                          setRetestTrigger(true);
                          setShowQuizModal(true);
                        }}
                        className={styles.retestQuizBtn}
                      >
                        <RefreshCw size={18} />
                        <span>Retake Milestone Quiz (Twisted Retest)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRetestTrigger(false);
                          setShowQuizModal(true);
                        }}
                        className={styles.launchQuizBtn}
                      >
                        <Play size={18} />
                        <span>Launch Checkpoint Test</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptySelection}>
              <BookOpen size={48} style={{ marginBottom: '16px' }} />
              <p>Select a checkpoint node on the left to view documentation and attempt the milestone test.</p>
            </div>
          )}
        </div>
      </div>

      {/* MCQ Quiz Modal */}
      {showQuizModal && (
        <QuizModal
          roadmapId={roadmapId}
          checkpointId={selectedCpId}
          isRetestTrigger={retestTrigger}
          onClose={() => setShowQuizModal(false)}
          onQuizSuccess={handleQuizSuccess}
        />
      )}
    </div>
  );
}
