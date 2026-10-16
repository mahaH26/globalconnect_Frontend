import {
  Button,
  Card,
  Empty,
  ErrorText,
  Muted,
  PageHeader,
  Row,
  listContent,
  listStyle,
} from "@/components/ui";
import { Notification, useNotifications } from "@/context/NotificationContext";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const SOFT = "#5B6385";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bahrain",
  });

/**
 * Admin notifications start with the employee's name ("t checked in late at 14:32.",
 * "TEST: Maha hafeez requested 3 day(s)"). Notifications about yourself start with "You".
 * Used only when the API doesn't send the name itself.
 */
const subjectFromMessage = (msg?: string | null) => {
  const text = (msg ?? "").trim();
  if (!text || /^(you|your)\b/i.test(text)) return null;
  const m =
    /^(?:test:\s*)?(.+?)\s+(?:tried to|checked (?:in|out)|requested|has|is|was)\b/i.exec(
      text,
    );
  const name = m?.[1]?.trim();
  return name && name.length <= 40 ? name : null;
};

const iconFor = (title: string): { name: IconName; fg: string; bg: string } => {
  const t = title.toLowerCase();
  if (t.includes("late") || t.includes("missing"))
    return { name: "time-outline", fg: colors.warning, bg: colors.warningSoft };
  if (t.includes("location") || t.includes("outside"))
    return {
      name: "location-outline",
      fg: colors.danger,
      bg: colors.dangerSoft,
    };
  if (t.includes("leave"))
    return { name: "calendar-outline", fg: colors.navy, bg: colors.navySoft };
  return {
    name: "notifications-outline",
    fg: colors.primary,
    bg: colors.accentSoft,
  };
};

export default function NotificationsScreen() {
  const {
    notifications,
    fetchNotifications,
    unreadCount,
    error,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();
  const [confirmClear, setConfirmClear] = useState(false);

  // Refresh every time the screen is opened (it is reached from the header bell)
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      setConfirmClear(false);
    }, [fetchNotifications]),
  );

  const onClearAll = async () => {
    if (!confirmClear) return setConfirmClear(true);
    setConfirmClear(false);
    await clearAll();
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const subject = item.userName ?? subjectFromMessage(item.message);
    const ic = iconFor(item.title);
    return (
      <Card
        style={{
          marginVertical: 5,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          padding: 16,
          backgroundColor: item.isRead ? colors.card : "#FFF7FA",
          borderColor: item.isRead ? colors.border : "#F9D6E3",
        }}
      >
        <View>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: ic.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={ic.name} size={18} color={ic.fg} />
          </View>
          {item.isRead ? null : (
            <View
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: "#FFF7FA",
              }}
            />
          )}
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={{
              fontSize: 14,
              fontStyle: "italic",
              fontWeight: item.isRead ? "500" : "600",
              color: colors.text,
            }}
          >
            {item.title}
            {subject ? (
              <Text style={{ fontWeight: "400", color: SOFT }}>
                {" "}
                from{" "}
                <Text style={{ fontWeight: "600", color: colors.primary }}>
                  {subject}
                </Text>
              </Text>
            ) : null}
          </Text>
          {item.message ? (
            <Text
              style={{
                color: SOFT,
                fontStyle: "italic",
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {item.message}
            </Text>
          ) : null}
          <Text
            style={{ color: colors.muted, fontSize: 12, fontStyle: "italic" }}
          >
            {when(item.createdAt)}
          </Text>
        </View>

        <Pressable
          onPress={() => deleteNotification(item.id)}
          accessibilityLabel="Delete notification"
          hitSlop={8}
          style={(s: any) => ({
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: s.hovered ? "#F4F5FA" : "transparent",
          })}
        >
          <Ionicons name="close" size={16} color={colors.muted} />
        </Pressable>
      </Card>
    );
  };

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={[listContent, { maxWidth: 720 }]}
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={{ gap: 14, marginBottom: 10 }}>
          <PageHeader
            title="Notifications"
            subtitle={
              unreadCount > 0
                ? `${unreadCount} unread`
                : notifications.length > 0
                  ? "You're all caught up"
                  : undefined
            }
          />
          {notifications.length > 0 ? (
            <Row style={{ flexWrap: "wrap", gap: 8 }}>
              {unreadCount > 0 ? (
                <Button
                  small
                  variant="secondary"
                  icon="checkmark-done-outline"
                  title="Mark all read"
                  onPress={markAllAsRead}
                />
              ) : null}
              <Button
                small
                variant={confirmClear ? "danger" : "secondary"}
                icon="trash-outline"
                title={confirmClear ? "Confirm clear all" : "Clear all"}
                onPress={onClearAll}
              />
              {confirmClear ? (
                <Button
                  small
                  variant="ghost"
                  title="Cancel"
                  onPress={() => setConfirmClear(false)}
                />
              ) : null}
            </Row>
          ) : null}
          {confirmClear ? (
            <Muted>This permanently deletes all notifications.</Muted>
          ) : null}
          <ErrorText>{error}</ErrorText>
        </View>
      }
      ListEmptyComponent={<Empty text="You are all caught up!" />}
    />
  );
}
