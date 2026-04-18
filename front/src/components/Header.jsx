import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import './Header.css';

function formatNotificationTime(createdAt, language, t) {
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

  if (elapsedMinutes < 1) {
    return t('header.justNow');
  }

  if (elapsedMinutes < 60) {
    if (language === 'ar') {
      return `منذ ${elapsedMinutes} ${t('header.minuteAgo')}`;
    }

    return `${elapsedMinutes} ${t('header.minuteAgo')}`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    if (language === 'ar') {
      return `منذ ${elapsedHours} ${t('header.hourAgo')}`;
    }

    return `${elapsedHours} ${t('header.hourAgo')}`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  if (language === 'ar') {
    return `منذ ${elapsedDays} ${elapsedDays === 1 ? t('header.dayAgo') : t('header.daysAgo')}`;
  }

  return `${elapsedDays} ${elapsedDays === 1 ? t('header.dayAgo') : t('header.daysAgo')}`;
}

function formatUrgentLabel(count, t) {
  return `${count} ${count === 1 ? t('header.urgentAlert') : t('header.urgentAlertsPlural')}`;
}

export default function Header({ searchQuery, onSearch, onOpenUserManagementSearch }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const notifRef = useRef(null);
  const alertRef = useRef(null);
  const { language, locale, t } = useAppPreferences();
  const {
    notifications,
    markAllRead,
    markNotificationRead,
    dismissAlert,
    deleteNotification,
  } = useNotifications();

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const urgentAlerts = notifications.filter((notification) => notification.urgent);

  useEffect(() => {
    function handleClick(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }

      if (alertRef.current && !alertRef.current.contains(event.target)) {
        setShowAlerts(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(currentDate);

  function handleNotificationClick(notification) {
    markNotificationRead(notification.id);

    if (notification.action?.type === 'open-user-management-search' && notification.action.userName) {
      onSearch('');
      setShowNotifs(false);
      onOpenUserManagementSearch?.(notification.action.userName);
    }
  }

  return (
    <header className="header">
      <div className="header-search">
        <span className="search-icon">{'\u{1F50D}'}</span>
        <input
          type="text"
          placeholder={t('header.searchPlaceholder')}
          className="search-input"
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
        />
        {searchQuery && (
          <button type="button" className="search-clear" onClick={() => onSearch('')}>
            {'\u2715'}
          </button>
        )}
      </div>

      <div className="header-actions">
        <div className="alert-wrapper" ref={alertRef}>
          <button
            type="button"
            className={`alert-btn urgent ${showAlerts ? 'alert-btn--active' : ''}`}
            onClick={() => {
              setShowAlerts((current) => !current);
              setShowNotifs(false);
            }}
          >
            <span className="alert-dot" />
            {formatUrgentLabel(urgentAlerts.length, t)}
          </button>

          {showAlerts && (
            <div className="alert-panel">
              <div className="alert-panel-header">
                <span>{t('header.urgentAlerts')}</span>
              </div>

              <ul className="alert-list">
                {urgentAlerts.length === 0 ? (
                  <li className="alert-empty">{t('header.noUrgentAlerts')}</li>
                ) : (
                  urgentAlerts.map((alert) => (
                    <li key={alert.id} className="alert-item">
                      <span className="alert-icon">{alert.icon}</span>
                      <div className="alert-body">
                        <p className="alert-title">{alert.title}</p>
                        <p className="alert-sub">{alert.sub}</p>
                        <span className="alert-time">
                          {formatNotificationTime(alert.createdAt, language, t)}
                        </span>
                      </div>
                      <div className="alert-actions">
                        <button
                          type="button"
                          className="alert-action alert-action--dismiss"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          {t('header.dismiss')}
                        </button>
                        <button
                          type="button"
                          className="alert-action alert-action--delete"
                          onClick={() => deleteNotification(alert.id)}
                        >
                          {t('header.delete')}
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`notif-btn ${showNotifs ? 'notif-btn--active' : ''}`}
            onClick={() => {
              setShowNotifs((current) => !current);
              setShowAlerts(false);
            }}
            aria-label="Open notifications"
          >
            {'\u{1F514}'}
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span>{t('header.notifications')}</span>
                <button
                  type="button"
                  className="notif-mark-all"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                >
                  {t('header.markAllRead')}
                </button>
              </div>

              <ul className="notif-list">
                {notifications.length === 0 ? (
                  <li className="notif-empty">{t('header.noNotifications')}</li>
                ) : (
                  notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`notif-item ${notification.urgent ? 'notif-item--urgent' : ''} ${notification.read ? 'notif-item--read' : ''}`}
                    >
                      <span className="notif-icon">{notification.icon}</span>
                      {notification.action ? (
                        <button
                          type="button"
                          className="notif-content-btn"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notif-body">
                            <p className="notif-title">{notification.title}</p>
                            <p className="notif-sub">{notification.sub}</p>
                          </div>
                        </button>
                      ) : (
                        <div className="notif-body">
                          <p className="notif-title">{notification.title}</p>
                          <p className="notif-sub">{notification.sub}</p>
                        </div>
                      )}
                      <div className="notif-actions">
                        <span className="notif-time">
                          {formatNotificationTime(notification.createdAt, language, t)}
                        </span>
                        <button
                          type="button"
                          className="notif-delete"
                          onClick={() => deleteNotification(notification.id)}
                          aria-label={`Delete notification: ${notification.title}`}
                        >
                          {t('header.delete')}
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="header-title">
        <span className="page-title">{t('header.academicOverview')}</span>
        <span className="page-date">{formattedDate}</span>
      </div>
    </header>
  );
}
