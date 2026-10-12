import { api } from "@/lib/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [rows, unread] = await Promise.all([
        api<any[]>("/notifications"),
        api<{ count: number }>("/notifications/unread-count"),
      ]);
      setNotifications(
        rows.map((r) => ({
          id: String(r.id),
          title: r.title,
          message: r.message,
          isRead: r.is_read,
          createdAt: r.created_at,
        })),
      );
      setUnreadCount(unread.count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      await fetchNotifications();
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  return context;
};
