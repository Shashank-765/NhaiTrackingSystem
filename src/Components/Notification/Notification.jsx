import React, { useEffect } from "react";
import "./Notification.css";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

const Notification = () => {
  const { user } = useAuth();
  const { notifications, clearNewNotificationStatus } = useNotifications();

  useEffect(() => {
    clearNewNotificationStatus();
  }, []);

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? "" : "s"} ago`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? "" : "s"} ago`;

    return `${Math.floor(seconds)} second${seconds === 1 ? "" : "s"} ago`;
  };

  const formatDateTime = (timestamp) => {
    const options = {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(timestamp).toLocaleString("en-IN", options);
  };

  const renderNotifications = () => {
    if (notifications.length === 0) {
      return <li className="no-notifications">No notifications yet</li>;
    }

    return notifications.map((notification) => (
      <li key={notification.id} className={`notification ${notification.type || ''}`}>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-meta">
          <div className="notification-time">
            {formatDateTime(notification.timestamp)} ({getTimeAgo(notification.timestamp)})
          </div>
          {/* {notification.type && (
            <div className={`notification-badge ${notification.type}`}>
              {notification.type === 'work-approval' ? '✓ Work Approved' : '💰 Payment'}
            </div>
          )} */}
        </div>
      </li>
    ));
  };

  return (
    <div className="notification-container">
      <h2>Notifications</h2>
      <div className="notification-list">
        <ul className="notifications">
          {renderNotifications()}
        </ul>
      </div>
    </div>
  );
};

export default Notification;
