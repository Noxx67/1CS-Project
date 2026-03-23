import { createContext, useContext, useState } from 'react';

const NotificationsContext = createContext(null);

function buildNotificationId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAllRead,
        markNotificationRead,
        dismissAlert,
        deleteNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
