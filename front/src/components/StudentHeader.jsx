import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './StudentHeader.module.css';

function Bell({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function ChevronDown({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function StudentHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/StudentProfile');
  };

  const getDisplayName = () => {
    if (!user) return 'Student';
    const firstName = user.first_name || user.firstName || 'Student';
    const lastName = user.last_name || user.lastName || '';
    const initial = lastName ? ` ${lastName[0].toUpperCase()}.` : '';
    return `${firstName}${initial}`;
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <button className={styles.notificationBtn} aria-label="Notifications">
          <Bell className={styles.notificationIcon} />
          <span className={styles.notificationDot}></span>
        </button>

        <div className={styles.userProfile} onClick={handleProfileClick}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{getDisplayName()}</p>
            <p className={styles.userRole}>{user?.promotion || 'Student'}</p>
          </div>
          <div className={styles.userAvatar}>
            <img
              src={user?.profile_picture || "/Icons/studentPicture.png"}
              alt={user?.name || "Student"}
              className={styles.avatarImage}
            />
          </div>
          <ChevronDown className={styles.chevronIcon} />
        </div>
      </div>
    </header>
  );
}
