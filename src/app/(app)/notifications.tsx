import { Center } from "@/components/ui";
import { Notification, useNotifications } from "@/context/NotificationContext";
import { colors } from "@/theme";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const { notifications, fetchNotifications, unreadCount, markAllAsRead } =
    useNotifications();

  // Refresh list when screen mounts to get the latest items
  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      // Replace with your real API endpoint if your backend supports marking all as read
      const response = await fetch(
        "http://192.168.1.60:3000/notifications/mark-all-as-read",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (response.ok) {
        fetchNotifications(); // Refresh state after marking read
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>
          {item.title}
        </Text>
        {!item.isRead && <View style={styles.badge} />}
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (!notifications) {
    return (
      <Center>
        <ActivityIndicator size="large" color={colors.primary} />
      </Center>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markReadBtn}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { alignItems: "center" }]}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>You are all caught up!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  markReadBtn: {
    color: colors.primary || "#007AFF",
    fontWeight: "600",
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eef0f2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    borderColor: colors.primary ? `${colors.primary}40` : "#007AFF40",
    backgroundColor: colors.primary ? `${colors.primary}05` : "#007AFF05",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    flex: 1,
  },
  unreadText: {
    color: "#212529",
    fontWeight: "700",
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary || "#007AFF",
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    color: "#adb5bd",
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#868e96",
  },
});
