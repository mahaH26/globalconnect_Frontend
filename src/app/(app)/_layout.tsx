import AppHeader from "@/components/AppHeader";
import Sidebar, { NavItem } from "@/components/Sidebar";
import { Center } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, useWindowDimensions } from "react-native";

const icon = (emoji: string) => () => (
  <Text style={{ fontSize: 18 }}>{emoji}</Text>
);

const ADMIN_NAV: NavItem[] = [
  { name: "index", label: "Dashboard", icon: "🏠" },
  { name: "employees", label: "Employees", icon: "👥" },
  { name: "team-attendance", label: "Attendance", icon: "🗓️" },
  { name: "leave-review", label: "Leave requests", icon: "✅" },
  { name: "reports", label: "Reports", icon: "📄" },
  { name: "locations", label: "Locations", icon: "📍" },
  { name: "chat", label: "Chat", icon: "💬" },
  { name: "profile", label: "Profile", icon: "👤" },
];

const EMPLOYEE_NAV: NavItem[] = [
  { name: "index", label: "Home", icon: "🏠" },
  { name: "attendance", label: "Attendance", icon: "🗓️" },
  { name: "leave", label: "Leave", icon: "🌴" },
  { name: "progress", label: "Progress", icon: "📈" },
  { name: "insights", label: "Insights", icon: "📊" },
  { name: "chat", label: "Chat", icon: "💬" },
  { name: "profile", label: "Profile", icon: "👤" },
];

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
      // Wide screens get the navy sidebar; phones keep the bottom tab bar
      tabBar={
        wide
          ? (props) => (
              <Sidebar
                {...props}
                items={isAdmin ? ADMIN_NAV : EMPLOYEE_NAV}
                isAdmin={isAdmin}
              />
            )
          : undefined
      }
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader />,
        tabBarPosition: wide ? "left" : "bottom",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
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
      <Tabs.Screen
  name="locations"
  options={{ title: "Locations", tabBarIcon: icon("📍"), href: adminOnly }}
/>
      <Tabs.Screen
  name="insights"
  options={{ title: "Insights", tabBarIcon: icon("📊"), href: employeeOnly }}
/>
<Tabs.Screen
  name="reports"
  options={{ title: "Reports", tabBarIcon: icon("📄"), href: adminOnly }}
/>
<Tabs.Screen
  name="chat"
  options={{ title: "Chat", tabBarIcon: icon("💬") }}
/>
      {/* Reached from the header, sidebar or lists; never in the tab bar */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="employee-new" options={{ href: null }} />
      <Tabs.Screen name="chat-new" options={{ href: null }} />
<Tabs.Screen name="chat-room" options={{ href: null }} />
      <Tabs.Screen name="employee-detail" options={{ href: null }} />
    </Tabs>
  );
}