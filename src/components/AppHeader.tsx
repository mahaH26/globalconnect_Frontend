import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SOFT = "#5B6385";
const PINK = "#FDE9F0";

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

/** Slim light top bar: page breadcrumb on the left, bell and avatar on the right */
export default function AppHeader({
  routeName,
  title,
}: {
  routeName: string;
  title?: string;
}) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
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

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        paddingHorizontal: wide ? 24 : 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Breadcrumb */}
      <View
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
      >
        {wide ? (
          <>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Workspace</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>/</Text>
          </>
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            color: colors.navy,
            fontSize: wide ? 13 : 17,
            fontWeight: wide ? "500" : "700",
          }}
        >
          {label}
        </Text>
      </View>

      {/* Admin indicator */}
      {isAdmin && wide ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#16A34A",
              }}
            />
            <Text style={{ color: SOFT, fontSize: 12 }}>Admin workspace</Text>
          </View>
          <View
            style={{ width: 1, height: 20, backgroundColor: colors.border }}
          />
        </>
      ) : null}

      {/* Bell */}
      <Pressable
        onPress={() => router.push("/notifications" as any)}
        accessibilityLabel="Notifications"
        style={(s: any) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: s.hovered ? "#F4F5FA" : "transparent",
        })}
      >
        <Ionicons name="notifications-outline" size={21} color={SOFT} />
        {unreadCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: 7,
              right: 8,
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: colors.primary,
              borderWidth: 1.5,
              borderColor: "#FFFFFF",
            }}
          />
        ) : null}
      </Pressable>

      {/* Avatar */}
      <Pressable
        onPress={() => router.push("/profile" as any)}
        accessibilityLabel="Profile"
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: PINK,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}
        >
          {initials || "?"}
        </Text>
      </Pressable>
    </View>
  );
}
