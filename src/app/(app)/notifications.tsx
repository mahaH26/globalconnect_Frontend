import {
  Button,
  Card,
  Empty,
  Muted,
  Title,
  listContent,
  listStyle,
} from "@/components/ui";
import { Notification, useNotifications } from "@/context/NotificationContext";
import { colors } from "@/theme";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, Text, View } from "react-native";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bahrain",
  });

export default function NotificationsScreen() {
  const { notifications, fetchNotifications, unreadCount, markAllAsRead } =
    useNotifications();

  // Refresh every time the screen is opened (it is reached from the header bell)
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const renderItem = ({ item }: { item: Notification }) => (
    <Card
      style={{
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: item.isRead ? colors.card : colors.accentSoft,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          marginTop: 6,
          backgroundColor: item.isRead ? colors.border : colors.primary,
        }}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: item.isRead ? "600" : "800",
            color: colors.text,
          }}
        >
          {item.title}
        </Text>
        {item.message ? <Text style={{ color: colors.text }}>{item.message}</Text> : null}
        <Muted>{when(item.createdAt)}</Muted>
      </View>
    </Card>
  );

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={listContent}
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <Title>Notifications</Title>
          {unreadCount > 0 ? (
            <Button small variant="secondary" title="Mark all read" onPress={markAllAsRead} />
          ) : null}
        </View>
      }
      ListEmptyComponent={<Empty text="You are all caught up!" />}
    />
  );
}