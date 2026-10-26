import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOGO = require("../../assets/logo/logo.png");

function pageLabel(
  routeName: string,
  title: string | undefined,
  isAdmin: boolean,
) {
  switch (routeName) {
    case "index":
      return isAdmin ? "Overview" : "Home";
    case "team-attendance":
      return "Attendance";
    case "leave-review":
      return "Leave requests";
    case "chat":
      return isAdmin ? "Messages" : "Chat";
    case "chat-new":
      return "New chat";
    case "chat-room":
      return "Chat";
    case "employee-new":
      return "New employee";
    case "employee-detail":
      return "Employee";
    default:
      return title ?? routeName;
  }
}

export default function AppHeader({
  routeName,
  title,
}: {
  routeName: string;
  title?: string;
}) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const isAdmin = user?.role === "admin";

  const label = pageLabel(routeName, title, isAdmin);
  const initials = (user?.full_name ?? "")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const iconButton = (s: any) => ({
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: s.hovered ? colors.hover : "transparent",
  });

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 10,
        paddingBottom: 10,
        paddingHorizontal: wide ? 24 : 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
        }}
      >
        {wide ? null : (
          <Image
            source={LOGO}
            resizeMode="contain"
            style={{ width: 120, height: 42 }}
          />
        )}
        {wide ? (
          <>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Workspace</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>/</Text>
          </>
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            flex: wide ? undefined : 1,
            color: colors.heading,
            fontSize: wide ? 13 : 15,
            fontWeight: wide ? "500" : "700",
            textAlign: wide ? "left" : "right",
          }}
        >
          {label}
        </Text>
      </View>

      {isAdmin && wide ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.success,
              }}
            />
            <Text style={{ color: colors.soft, fontSize: 12 }}>
              Admin workspace
            </Text>
          </View>
          <View
            style={{ width: 1, height: 20, backgroundColor: colors.border }}
          />
        </>
      ) : null}

      <Pressable
        onPress={toggle}
        accessibilityLabel={
          isDark ? "Switch to light mode" : "Switch to dark mode"
        }
        style={iconButton}
      >
        <Ionicons
          name={isDark ? "sunny-outline" : "moon-outline"}
          size={21}
          color={colors.soft}
        />
      </Pressable>

      <Pressable
        onPress={() => router.push("/notifications" as any)}
        accessibilityLabel="Notifications"
        style={iconButton}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.soft} />
        {unreadCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 9,
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: colors.primary,
              borderWidth: 1.5,
              borderColor: colors.card,
            }}
          />
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => router.push("/profile" as any)}
        accessibilityLabel="Profile"
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.accentSoft,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={{ width: 34, height: 34 }}
          />
        ) : (
          <Text
            style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}
          >
            {initials || "?"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
