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
  /** Employee the notification is about (needs the API to return it) */
  userName: string | null;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  /** Last error from a delete / clear action, shown on the notifications screen */
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
          // the table column is called `body`
          message: r.message ?? r.body ?? "",
          isRead: r.is_read,
          createdAt: r.created_at,
          userName:
            r.user_name ??
            r.full_name ??
            r.employee_name ??
            r.profiles?.full_name ??
            null,
        })),
      );
      setUnreadCount(unread.count);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      await fetchNotifications();
    } catch (e) {
      console.error("Error updating notifications:", e);
    }
  }, [fetchNotifications]);

  // Deletes one notification from the database, then refreshes
  const deleteNotification = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await api(`/notifications/${id}`, { method: "DELETE" });
        setNotifications((list) => list.filter((n) => n.id !== id));
        await fetchNotifications();
      } catch (e: any) {
        setError(e?.message ?? "Could not delete the notification");
        await fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  // Deletes all notifications from the database
  const clearAll = useCallback(async () => {
    setError(null);
    try {
      try {
        await api("/notifications", { method: "DELETE" });
      } catch (e: any) {
        // The server has no "delete everything" route (404): delete them one by one instead
        if (e?.status !== 404) throw e;
        const rows = await api<any[]>("/notifications");
        const results = await Promise.allSettled(
          rows.map((r) => api(`/notifications/${r.id}`, { method: "DELETE" })),
        );
        const failed = results.find((r) => r.status === "rejected") as
          | PromiseRejectedResult
          | undefined;
        if (failed) throw failed.reason;
      }
      setNotifications([]);
      setUnreadCount(0);
    } catch (e: any) {
      setError(e?.message ?? "Could not clear notifications");
      await fetchNotifications();
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
      value={{
        notifications,
        unreadCount,
        error,
        fetchNotifications,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
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
