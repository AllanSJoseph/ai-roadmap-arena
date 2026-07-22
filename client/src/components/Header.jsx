import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Compass, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [healthStatus, setHealthStatus] = useState('pinging'); // 'pinging' | 'available' | 'failed' | 'permanently_failed'
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timer;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/health`);
        if (response.ok) {
          if (isMounted) {
            setHealthStatus('available');
            setRetryCount(0); // Reset counter on successful check
          }
        } else {
          throw new Error('Non-200 response');
        }
      } catch (err) {
        if (!isMounted) return;
        
        if (retryCount < 5) {
          setHealthStatus('failed');
          timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000); // 3 seconds delay before retry
        } else {
          setHealthStatus('permanently_failed');
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [retryCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderHealthIndicator = () => {
    let dotClass = styles.dotYellow;
    let text = 'Pinging backend';
    let tooltip = 'Connecting to backend to check if it is available';

    if (healthStatus === 'available') {
      dotClass = styles.dotGreen;
      text = 'Backend Available';
      tooltip = 'Backend connection is healthy and online';
    } else if (healthStatus === 'failed') {
      dotClass = styles.dotRed;
      text = 'Backend Not Available';
      tooltip = `Connecting to backend failed. Retrying... (Attempt ${retryCount}/5)`;
    } else if (healthStatus === 'permanently_failed') {
      dotClass = styles.dotRed;
      text = 'Failed to Ping Backend, Sorry for the inconvenience';
      tooltip = 'Failed to establish connection after 5 attempts';
    }

    return (
      <div className={styles.healthIndicator} title={tooltip}>
        <span className={`${styles.indicatorDot} ${dotClass}`} />
        <span className={styles.indicatorText}>{text}</span>
      </div>
    );
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.headerContainer} container`}>
        <Link to="/" className={styles.logo}>
          <Compass className={styles.logoIcon} />
          <span className="gradient-text font-outfit">AI Roadmap Arena</span>
        </Link>

        <nav className={styles.nav}>
          {renderHealthIndicator()}
          {user ? (
            <>
              <Link to="/dashboard" className={styles.navLink}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <div className={styles.userProfile}>
                <UserIcon size={16} className={styles.userIcon} />
                <span className={styles.userName}>{user.name}</span>
              </div>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navLink}>Login</Link>
              <Link to="/signup" className={styles.signupBtn}>Get Started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
