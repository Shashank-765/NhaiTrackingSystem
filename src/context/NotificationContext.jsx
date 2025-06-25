import React, { createContext, useContext, useState, useEffect } from "react";
import Pusher from "pusher-js";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem("notifications");
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });

  const { user } = useAuth();

  useEffect(() => {
    console.log('Pusher Configuration:', {
      key: import.meta.env.VITE_PUSHER_KEY ? 'Configured' : 'Missing',
      cluster: import.meta.env.VITE_PUSHER_CLUSTER ? 'Configured' : 'Missing'
    });
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping Pusher setup');
      return;
    }
    // Initialize Pusher
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    });

    let currentChannel = null;

    if (user.role.toLowerCase() === "admin") {
      currentChannel = pusher.subscribe("admin-channel");  
        currentChannel.bind("agency-payment-received", (data) => {
        console.log("Received agency payment notification:", data);
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "agency-payment",
          batchId: data.batchId,
          agencyName: data.agencyName,
          contractTitle: data.contractTitle,
          amount: data.amount
        };
        console.log("Adding notification:", notification);
        addNotification(notification);
      });

      // Add connection status logging
      pusher.connection.bind('connected', () => {
        console.log('Pusher connected successfully');
      });

      pusher.connection.bind('error', (err) => {
        console.error('Pusher connection error:', err);
      });

      // Existing admin bindings
      currentChannel.bind("invoice-downloaded", (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "invoice-download",
        };
        addNotification(notification);
      });

      // Add batch creation notification for admin
      currentChannel.bind("batch-created", (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "batch-creation",
          batchId: data.batchId,
          agencyId: data.agencyId,
        };
        addNotification(notification);
      });

      currentChannel.bind(`batch-approved-${user.id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "batch-approval",
          batchId: data.batchId,
        };
        addNotification(notification);
      });

      currentChannel.bind("work-status-update", (data) => {
        console.log("[PUSHER] Admin received work-status-update:", data);
        addNotification({
          ...data,
          type: "work-status-update"
        });
      });

      currentChannel.bind("milestone-status-update", (data) => {
        console.log("[PUSHER] Admin received milestone-status-update:", data);
        addNotification({
          ...data,
          type: "milestone-status-update"
        });
      });
    } else if (user.role.toLowerCase() === "agency") {
      currentChannel = pusher.subscribe("agency-channel");
      // Listen for batch creation notifications from admin
      currentChannel.bind("batch-created", (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "batch-creation",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
      // Listen for payment notifications
      currentChannel.bind(`payment-completed-${user.id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "payment",
        };
        addNotification(notification);
      });
      // Listen for batch creation notifications
      currentChannel.bind(`batch-created-${user._id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "batch-creation",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
      // Listen for work completion notifications
      currentChannel.bind(`work-completed-${user.id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "work-completion",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
      // Listen for work approval notifications
      currentChannel.bind(`work-approved-${user.id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "work-approval",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
    } else if (user.role.toLowerCase() === "contractor") {
      currentChannel = pusher.subscribe("contractor-channel");
      const contractorId = user._id || user.id; // fallback if _id not present
      console.log("[PUSHER] Contractor subscribing to:", `batch-created-${contractorId}`);
      // Listen for batch-created notifications
      currentChannel.bind(`batch-created-${contractorId}`, (data) => {
        console.log("[PUSHER] Contractor received batch-created notification:", data);
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "batch-creation",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
      // Listen for payment notifications
      currentChannel.bind(`payment-completed-${user.id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "payment",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
      // Listen for work approval notifications
      currentChannel.bind(`work-approved-${user.id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "work-approval",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
      // Listen for batch approval notifications
      currentChannel.bind(`batch-approved-${user.id}`, (data) => {
        const notification = {
          id: data.id,
          message: data.message,
          timestamp: data.timestamp,
          type: "batch-approval",
          batchId: data.batchId,
        };
        addNotification(notification);
      });
    }

    // Cleanup on unmount
    return () => {
      if (currentChannel) {
        currentChannel.unbind_all();
        pusher.unsubscribe(currentChannel.name);
      }
      pusher.disconnect();
    };
  }, [user]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification) => {
    console.log('Adding new notification:', notification);
    setNotifications((prev) => {
      const newNotifications = [notification, ...prev];
      return newNotifications;
    });
    setHasNewNotification(true);
  };

  const clearNewNotificationStatus = () => {
    setHasNewNotification(false);
  }; // Filter notifications based on user role and type
  const filteredNotifications = (() => {
    if (!user) return [];

    switch (user.role.toLowerCase()) {
      case "admin":
        return notifications.filter(
          (notif) =>
            notif.type === "invoice-download" ||
            notif.type === "batch-approval" ||
            notif.type === "agency-payment" ||
            notif.type === "work-status-update" ||
            notif.type === "milestone-status-update"
        );
      case "contractor":
        return notifications.filter(
          (notif) =>
            notif.type === "payment" ||
            notif.type === "work-approval" ||
            notif.type === "batch-approval" ||
            notif.type === "batch-creation"
        );
      case "agency":
        return notifications.filter(
          (notif) =>
            notif.type === "payment" ||
            notif.type === "work-completion" ||
            notif.type === "batch-approval" ||
            notif.type === "work-approval" ||
            notif.type === "batch-creation"
        );
      default:
        return [];
    }
  })();

  return (
    <NotificationContext.Provider
      value={{
        notifications: filteredNotifications,
        hasNewNotification,
        addNotification,
        clearNewNotificationStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
