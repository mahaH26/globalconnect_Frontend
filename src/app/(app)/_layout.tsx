import AppHeader from "@/components/AppHeader";
import { Center } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, useWindowDimensions } from "react-native";

const icon = (emoji: string) => () => (
  <Text style={{ fontSize: 18 }}>{emoji}</Text>
);

export default function AppLayout() {
  const { user, loading } = useAuth();
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
  const employeeOnly = isAdmin ? null : undefined;
  const adminOnly = isAdmin ? undefined : null;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader />,
        tabBarPosition: wide ? "left" : "bottom",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelPosition: wide ? "below-icon" : undefined,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: colors.border,
        },
      }}
    >
      {/* Visible tabs, in order */}
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: icon("🏠") }}
      />
      <Tabs.Screen
        name="employees"
        options={{ title: "Employees", tabBarIcon: icon("👥"), href: adminOnly }}
      />
      <Tabs.Screen
        name="team-attendance"
        options={{ title: "Attendance", tabBarIcon: icon("🗓️"), href: adminOnly }}
      />
      <Tabs.Screen
        name="leave-review"
        options={{ title: "Leaves", tabBarIcon: icon("✅"), href: adminOnly }}
      />
      <Tabs.Screen
        name="attendance"
        options={{ title: "Attendance", tabBarIcon: icon("🗓️"), href: employeeOnly }}
      />
      <Tabs.Screen
        name="leave"
        options={{ title: "Leave", tabBarIcon: icon("🌴"), href: employeeOnly }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarIcon: icon("📈"), href: employeeOnly }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: icon("👤") }}
      />

      {/* Reached from the header bell, quick actions or lists; never in the tab bar */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="employee-new" options={{ href: null }} />
      <Tabs.Screen name="employee-detail" options={{ href: null }} />
    </Tabs>
  );
}