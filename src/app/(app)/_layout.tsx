import { Center } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { colors } from "@/theme";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, useWindowDimensions } from "react-native";

const icon = (emoji: string) => () => (
  <Text style={{ fontSize: 18 }}>{emoji}</Text>
);

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  if (loading)
    return (
      <Center>
        <ActivityIndicator size="large" color={colors.primary} />
      </Center>
    );
  if (!user) return <Redirect href="/login" />;

  const isAdmin = user.role === "admin";

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
          title: isAdmin ? "Dashboard" : "Home",
          tabBarIcon: icon("🏠"),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: icon("🔔"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: "red", color: "white" },
        }}
      />

      {/* Employee only */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: icon("🗓️"),
          href: isAdmin ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: "Leave",
          tabBarIcon: icon("🌴"),
          href: isAdmin ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: icon("📈"),
          href: isAdmin ? null : undefined,
        }}
      />

      {/* Admin only */}
      <Tabs.Screen
        name="employees"
        options={{
          title: "Employees",
          tabBarIcon: icon("👥"),
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="leave-review"
        options={{
          title: "Leave requests",
          tabBarIcon: icon("✅"),
          href: isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: icon("👤") }}
      />
    </Tabs>
  );
}
