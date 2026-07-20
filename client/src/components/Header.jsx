import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Compass, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.headerContainer} container`}>
        <Link to="/" className={styles.logo}>
          <Compass className={styles.logoIcon} />
          <span className="gradient-text font-outfit">AI Roadmap Arena</span>
        </Link>

        <nav className={styles.nav}>
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
