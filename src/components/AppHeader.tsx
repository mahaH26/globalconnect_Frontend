import { Avatar } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { colors } from "@/theme";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Bahrain is UTC+3 all year
const greeting = () => {
  const h = new Date(Date.now() + 3 * 3600 * 1000).getUTCHours();
  return h < 12 ? "Good morning," : h < 18 ? "Good afternoon," : "Good evening,";
};

const today = () =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Bahrain",
  });

const circle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(255,255,255,0.14)",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

export default function AppHeader() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === "admin";

  return (
    <View
      style={{
        backgroundColor: colors.navy,
        paddingTop: insets.top + 14,
        paddingBottom: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          width: "100%",
          maxWidth: 900,
          alignSelf: "center",
        }}
      >
        {/* Notifications: top left */}
        <Pressable onPress={() => router.push("/notifications" as any)} style={circle}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          {unreadCount > 0 ? (
            <View
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: "#C9CDE8", fontSize: 13 }} numberOfLines={1}>
            {greeting()} · {today()}
          </Text>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }} numberOfLines={1}>
            {user?.full_name ?? ""}
          </Text>
        </View>

        {/* Settings: admins only */}
        {isAdmin ? (
          <Pressable onPress={() => router.push("/settings" as any)} style={circle}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => router.push("/profile" as any)}>
          <Avatar name={user?.full_name} size={44} bg={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}