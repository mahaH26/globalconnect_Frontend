import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

export type NavItem = { name: string; label: string; icon: string };

const COLLAPSED = 72;
const EXPANDED = 240;

/** Desktop navigation menu: icons only, expands with labels on hover */
export default function Sidebar({
  state,
  navigation,
  items,
  isAdmin,
}: BottomTabBarProps & { items: NavItem[]; isAdmin: boolean }) {
  const { logout } = useAuth();
  const router = useRouter();
  const active = state.routes[state.index]?.name;

  const [expanded, setExpanded] = useState(false);
  const width = useRef(new Animated.Value(COLLAPSED)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;

  const animate = (open: boolean) => {
    setExpanded(open);
    Animated.parallel([
      Animated.timing(width, {
        toValue: open ? EXPANDED : COLLAPSED,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // width can't use the native driver
      }),
      Animated.timing(labelOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? 200 : 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const row = (
    key: string,
    icon: string,
    label: string,
    on: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={(s: any) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: on
          ? colors.primary
          : s.hovered || s.pressed
            ? "rgba(255,255,255,0.10)"
            : "transparent",
      })}
    >
      <Text style={{ fontSize: 18, width: 20, textAlign: "center" }}>
        {icon}
      </Text>
      <Animated.Text
        numberOfLines={1}
        style={{
          opacity: labelOpacity,
          color: on ? "#fff" : "#C9CDE8",
          fontWeight: "700",
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );

  return (
    // Fixed-width placeholder so the page content doesn't shift when the menu expands
    <View style={{ width: COLLAPSED, zIndex: 50 }}>
      <Animated.View
        // hover handlers (react-native-web)
        {...({
          onMouseEnter: () => animate(true),
          onMouseLeave: () => animate(false),
        } as any)}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width,
          backgroundColor: colors.navy,
          paddingVertical: 20,
          paddingHorizontal: 14,
          justifyContent: "space-between",
          overflow: "hidden",
          // soft shadow when floating over content
          ...(expanded
            ? ({ boxShadow: "4px 0 16px rgba(0,0,0,0.25)" } as any)
            : null),
        }}
      >
        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 22,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: 44,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>GC</Text>
            </View>
            <Animated.View style={{ opacity: labelOpacity }}>
              <Text
                numberOfLines={1}
                style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}
              >
                Global Connect
              </Text>
              <Text numberOfLines={1} style={{ color: "#9AA0C9", fontSize: 12 }}>
                Staff portal
              </Text>
            </Animated.View>
          </View>

          {items.map((it) =>
            row(it.name, it.icon, it.label, active === it.name, () =>
              navigation.navigate(it.name as never),
            ),
          )}
        </View>

        <View style={{ gap: 6 }}>
          {isAdmin
            ? row("settings", "⚙️", "Settings", active === "settings", () =>
                router.push("/settings" as any),
              )
            : null}
          {row("logout", "🚪", "Sign out", false, () => {
            logout();
          })}
        </View>
      </Animated.View>
    </View>
  );
}