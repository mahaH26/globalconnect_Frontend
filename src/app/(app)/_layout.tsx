import AppHeader from "@/components/AppHeader";
import Sidebar, { BottomNav, NavItem } from "@/components/Sidebar";
import { Center } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, usePathname } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  type ColorValue,
  useWindowDimensions,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const icon =
  (name: string) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons
      name={(focused ? name : `${name}-outline`) as IconName}
      size={22}
      color={color}
    />
  );

const ADMIN_NAV: NavItem[] = [
  { name: "index", label: "Overview", icon: "home" },
  { name: "employees", label: "Employees", icon: "people" },
  { name: "team-attendance", label: "Attendance", icon: "calendar" },
  { name: "leave-review", label: "Leave requests", icon: "shield-checkmark" },
  { name: "reports", label: "Reports", icon: "document-text" },
  { name: "locations", label: "Locations", icon: "location" },
  { name: "chat", label: "Messages", icon: "chatbubble" },
];

const EMPLOYEE_NAV: NavItem[] = [
  { name: "index", label: "Home", icon: "home" },
  { name: "attendance", label: "Attendance", icon: "calendar" },
  { name: "leave", label: "Leave", icon: "sunny" },
  { name: "progress", label: "Progress", icon: "trending-up" },
  { name: "insights", label: "Insights", icon: "stats-chart" },
  { name: "chat", label: "Chat", icon: "chatbubble" },
  { name: "profile", label: "Profile", icon: "person" },
];

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [pendingLeaves, setPendingLeaves] = useState(0);

  // desktop: full sidebar · iPad / small windows: icon rail · phone: bottom nav
  const mode: "full" | "rail" | "mobile" =
    width >= 1024 ? "full" : width >= 700 ? "rail" : "mobile";

  const isAdmin = user?.role === "admin";

  // Count shown on "Leave requests"; refreshed whenever you change screen
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    api<{ alerts: { pending_leave_requests: number } }>("/dashboard")
      .then((d) => {
        if (!cancelled) setPendingLeaves(d.alerts?.pending_leave_requests ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdmin, pathname]);

  if (loading)
    return (
      <Center>
        <ActivityIndicator size="large" color={colors.primary} />
      </Center>
    );
  if (!user) return <Redirect href="/login" />;

  const employeeOnly = isAdmin ? null : undefined;
  const adminOnly = isAdmin ? undefined : null;

  const items = (isAdmin ? ADMIN_NAV : EMPLOYEE_NAV).map((it) =>
    it.name === "leave-review" ? { ...it, badge: pendingLeaves } : it,
  );

  return (
    <Tabs
      tabBar={(props) =>
        mode === "mobile" ? (
          <BottomNav {...props} items={items} isAdmin={isAdmin} />
        ) : (
          <Sidebar
            {...props}
            items={items}
            isAdmin={isAdmin}
            hoverExpand={mode === "full"}
          />
        )
      }
      screenOptions={{
        headerShown: true,
        header: ({ options, route }) => (
          <AppHeader
            routeName={route.name}
            title={
              typeof options.title === "string" ? options.title : undefined
            }
          />
        ),
        tabBarPosition: mode === "mobile" ? "bottom" : "left",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: icon("home") }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: "Employees",
          tabBarIcon: icon("people"),
          href: adminOnly,
        }}
      />
      <Tabs.Screen
        name="team-attendance"
        options={{
          title: "Attendance",
          tabBarIcon: icon("calendar"),
          href: adminOnly,
        }}
      />
      <Tabs.Screen
        name="leave-review"
        options={{
          title: "Leaves",
          tabBarIcon: icon("checkmark-circle"),
          href: adminOnly,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: icon("calendar"),
          href: employeeOnly,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: "Leave",
          tabBarIcon: icon("sunny"),
          href: employeeOnly,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: icon("trending-up"),
          href: employeeOnly,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: icon("person") }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Locations",
          tabBarIcon: icon("location"),
          href: adminOnly,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: icon("stats-chart"),
          href: employeeOnly,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: icon("document-text"),
          href: adminOnly,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Chat", tabBarIcon: icon("chatbubble") }}
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
