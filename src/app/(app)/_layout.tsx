import { Center } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext"; // Add this import
import { colors } from "@/theme";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, useWindowDimensions } from "react-native";

const icon = (emoji: string) => () => (
  <Text style={{ fontSize: 18 }}>{emoji}</Text>
);

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { unreadCount } = useNotifications(); // Grab the live unread count
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  if (loading)
    return (
      <Center>
        <ActivityIndicator size="large" color={colors.primary} />
      </Center>
    );
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? "left" : "bottom",
        tabBarActiveTintColor: colors.primary,
        tabBarLabelPosition: wide ? "below-icon" : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: user.role === "admin" ? "Dashboard" : "Home",
          tabBarIcon: icon("🏠"),
        }}
      />

      {/* 🔔 Added Notifications Screen */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: icon("🔔"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined, // Shows badge only if > 0
          tabBarBadgeStyle: { backgroundColor: "red", color: "white" },
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{ title: "Attendance", tabBarIcon: icon("🗓️") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: icon("👤") }}
      />
    </Tabs>
  );
}
