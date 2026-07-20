import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { Plus, Compass, Map, Calendar, GraduationCap } from 'lucide-react';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const data = await api.getRoadmaps();
        setRoadmaps(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch roadmaps');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRoadmaps();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={`${styles.dashboardContainer} container`}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Your Roadmaps</h1>
          <p className={styles.subtitle}>Select a personalized pathway to continue learning</p>
        </div>
        <Link to="/" className={styles.newRoadmapBtn}>
          <Plus size={20} />
          <span>New Roadmap</span>
        </Link>
      </div>

      {error && <div style={{ color: 'var(--error)', marginBottom: '20px' }}>{error}</div>}

      {roadmaps.length === 0 ? (
        <div className={`${styles.emptyState} glass-card`}>
          <Map className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No roadmaps generated yet</h3>
          <p className={styles.emptyText}>
            Begin by generating your first AI-guided milestone roadmap customized for your career path.
          </p>
          <Link to="/" className={styles.newRoadmapBtn}>
            <Plus size={20} />
            <span>Generate Roadmap</span>
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {roadmaps.map((roadmap) => (
            <Link
              key={roadmap.id}
              to={`/roadmaps/${roadmap.id}`}
              className={`${styles.roadmapCard} glass-card`}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{roadmap.role}</h3>
                <Compass className={styles.cardIcon} />
              </div>

              <div className={styles.specializations}>
                {roadmap.specializations.map((spec) => (
                  <span key={spec} className={styles.specBadge}>
                    {spec}
                  </span>
                ))}
              </div>

              <div className={styles.cardFooter}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GraduationCap size={14} />
                  {roadmap.experience_level}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} />
                  {new Date(roadmap.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
