import { createContext, useCallback, useContext, useState } from 'react';

const NotificationsContext = createContext(null);

export const JUSTIFICATION_NOTIFICATION_SOURCE = 'justification-pending';

function buildNotificationId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildJustificationNotificationId(documentId) {
  return `justification-${documentId}`;
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  function addNotification(notification) {
    setNotifications((current) => [
      {
        id: buildNotificationId(),
        icon: notification.icon || '\u{1F514}',
        title: notification.title || 'New notification',
        sub: notification.sub || '',
        urgent: notification.urgent || false,
        action: notification.action || null,
        read: false,
        createdAt: notification.createdAt || new Date().toISOString(),
      },
      ...current,
    ]);
  }

  function markAllRead() {
    setNotifications((current) =>
      current.map((notification) =>
        notification.read ? notification : { ...notification, read: true }
      )
    );
  }

  function dismissAlert(id) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, urgent: false, read: true }
          : notification
      )
    );
  }

  function markNotificationRead(id) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id && !notification.read
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  function deleteNotification(id) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }

  const syncJustificationNotifications = useCallback((pendingDocuments = []) => {
    setNotifications((current) => {
      const otherNotifications = current.filter(
        (notification) => notification.source !== JUSTIFICATION_NOTIFICATION_SOURCE,
      );

      const justificationNotifications = pendingDocuments.map((doc) => {
        const studentLabel = String(doc.studentName || '').trim() || 'A student';
        const details = [
          doc.documentTypeLabel,
          doc.absenceDate,
          doc.group ? `Group ${doc.group}` : '',
        ].filter(Boolean).join(' · ');

        return {
          id: buildJustificationNotificationId(doc.id),
          source: JUSTIFICATION_NOTIFICATION_SOURCE,
          icon: '\u{1F4C4}',
          title: `Justification pending — ${studentLabel}`,
          sub: details || String(doc.reason || '').trim() || 'Awaiting review',
          urgent: false,
          read: false,
          createdAt: doc.submissionDate || new Date().toISOString(),
        };
      });

      return [...justificationNotifications, ...otherNotifications];
    });
  }, []);

  const removeJustificationNotification = useCallback((documentId) => {
    const targetId = buildJustificationNotificationId(documentId);
    setNotifications((current) => current.filter((notification) => notification.id !== targetId));
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAllRead,
        markNotificationRead,
        dismissAlert,
        deleteNotification,
        syncJustificationNotifications,
        removeJustificationNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
