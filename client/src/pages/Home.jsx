import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { Sparkles, X } from 'lucide-react';
import styles from './Home.module.css';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('Full Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [context, setContext] = useState('');
  const [tags, setTags] = useState(['React', 'Node.js', 'PostgreSQL']);
  const [tagInput, setTagInput] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Loading text sequence timer
  useEffect(() => {
    let interval;
    if (generating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const loadingMessages = [
    { text: "Analyzing your experience level and specializations...", subtext: "Understanding your current background context" },
    { text: "Formulating milestone checkpoints with Gemini...", subtext: "Personalizing checkpoints to fit your career goal" },
    { text: "Gathering curated learning links and documentation...", subtext: "Attaching high-value references for your roadmap" },
    { text: "Structuring database progress models and active locks...", subtext: "Preparing your checkpoint quiz arena" }
  ];

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/,$/, '');
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleAddTagButton = () => {
    const cleanTag = tagInput.trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!context.trim()) {
      setError('Please provide some context regarding your current status.');
      return;
    }
    setError('');
    setGenerating(true);

    const finalRole = role === 'Custom' ? customRole : role;

    try {
      const data = await api.generateRoadmap(finalRole, experienceLevel, context, tags);
      // Success, navigate to roadmap dashboard view
      navigate(`/roadmaps/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap. Please try again.');
      setGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.homeContainer}>
        <div className={styles.spinner} />
        <p>Loading application state...</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className={styles.homeContainer}>
        <div className={`${styles.loaderOverlay} glass-card float-animation`}>
          <div className={styles.spinner} />
          <h3 className={styles.loadingText}>{loadingMessages[loadingStep].text}</h3>
          <p className={styles.loadingSubtext}>{loadingMessages[loadingStep].subtext}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.homeContainer}>
      <div className={styles.hero}>
        <h1 className={`${styles.heroTitle} gradient-text`}>Design Your Learning Path</h1>
        <p className={styles.heroSubtitle}>
          Provide your current career background and target roles. Our AI will curate a personalized milestone roadmap with interactive checkpoint tests.
        </p>
      </div>

      <div className={`${styles.generatorCard} glass-card`}>
        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Target Career Role</label>
              <select
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Mobile Developer">Mobile Developer</option>
                <option value="Custom">Custom Role...</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Experience Level</label>
              <select
                className={styles.select}
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <option value="Beginner">Beginner (No experience)</option>
                <option value="Intermediate">Intermediate (1-3 years)</option>
                <option value="Advanced">Advanced (4+ years)</option>
              </select>
            </div>

            {role === 'Custom' && (
              <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                <label className={styles.label}>Specify Custom Role Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Engineer, Systems Architect"
                  className={styles.input}
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              </div>
            )}

            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label className={styles.label}>Specialization Technologies & Focus Areas</label>
              <div className={styles.tagContainer}>
                {tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className={styles.removeTagBtn}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Type tag & press Enter"
                  className={styles.tagInput}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={handleAddTagButton}
                />
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label className={styles.label}>Describe your current skills, status, and constraints</label>
              <textarea
                required
                className={styles.textarea}
                placeholder="Example: I am a self-taught frontend developer looking to learn backend and DB. I have built 2 React apps, know CSS Flexbox, and want to learn NodeJS. I have 10 hours a week for the next 2 months."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className={styles.generateBtn}>
            <Sparkles size={20} />
            <span>Generate Personalized Roadmap</span>
          </button>
        </form>
      </div>
    </div>
  );
}
