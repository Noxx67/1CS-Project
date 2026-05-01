import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useNotifications } from '../context/NotificationsContext';
import styles from './ScolaritePageHeader.module.css';

function Icon({ name }) {
  if (name === 'bell') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a4.8 4.8 0 0 0-4.8 4.8v2.1c0 1-.34 1.98-.95 2.78L4.8 16h14.4l-1.45-1.82a4.4 4.4 0 0 1-.95-2.78V9.3A4.8 4.8 0 0 0 12 4.5Z" />
        <path d="M9.9 18.2a2.1 2.1 0 0 0 4.2 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.2" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || 'AO';
}

function formatNotificationTime(createdAt, t) {
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

  if (elapsedMinutes < 1) {
    return t('header.justNow');
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} ${t('header.minuteAgo')}`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours} ${t('header.hourAgo')}`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? t('header.dayAgo') : t('header.daysAgo')}`;
}

export default function ScolaritePageHeader({
  title,
  breadcrumb,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search for a student, department, or program...',
  notificationCount = 0,
  children,
}) {
  const { user } = useAuth();
  const { t } = useAppPreferences();
  const {
    notifications,
    markAllRead,
    markNotificationRead,
    dismissAlert,
    deleteNotification,
  } = useNotifications();
  const notificationsRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const displayName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Academic Office Service';
  const roleLabel = t(`roles.${String(user?.role || '').toUpperCase()}`, user?.role || 'Scolarite');
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const notificationBadgeCount = unreadCount || notificationCount;

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <h1>{title}</h1>
        <p>{breadcrumb}</p>
      </div>

      <label className={styles.searchField}>
        <span className={styles.searchIcon}>
          <Icon name="search" />
        </span>
        <input
          type="search"
          value={searchQuery}
          placeholder={searchPlaceholder}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className={styles.headerActions} ref={notificationsRef}>
        {children}

        <button type="button" className={styles.notificationButton} onClick={() => setNotificationsOpen(true)} aria-label={t('header.notifications')}>
          <Icon name="bell" />
          {notificationBadgeCount > 0 ? (
            <span className={styles.notificationBadge}>{notificationBadgeCount}</span>
          ) : null}
        </button>

        {notificationsOpen ? (
          <section className={styles.notificationPanel} aria-label={t('header.notifications')}>
            <header className={styles.notificationPanelHeader}>
              <h2>{t('header.notifications')}</h2>
              <button
                type="button"
                className={styles.notificationPanelButton}
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                {t('header.markAllRead')}
              </button>
            </header>

            {notifications.length === 0 ? (
              <p className={styles.notificationEmpty}>
                {t('header.noNotifications')}
              </p>
            ) : (
              <ul className={styles.notificationList}>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`${styles.notificationItem} ${notification.read ? styles.notificationItemRead : ''}`}
                  >
                    <span className={styles.notificationIcon}>{notification.icon}</span>
                    <button
                      type="button"
                      className={styles.notificationContent}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <strong>{notification.title}</strong>
                      {notification.sub ? <span>{notification.sub}</span> : null}
                      <small>{formatNotificationTime(notification.createdAt, t)}</small>
                    </button>
                    <div className={styles.notificationActions}>
                      {notification.urgent ? (
                        <button type="button" onClick={() => dismissAlert(notification.id)}>
                          {t('header.dismiss')}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => deleteNotification(notification.id)}>
                        {t('header.delete')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <div className={styles.accountMenu}>
          <span className={styles.accountAvatar}>{getInitials(displayName)}</span>
          <span className={styles.accountText}>
            <span className={styles.accountName}>{displayName}</span>
            <span className={styles.accountRole}>{roleLabel}</span>
          </span>
          <span className={styles.accountChevron} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
