import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type NavItem = {
  name: string;
  label: string;
  icon: string;
  badge?: number;
};

type IconName = ComponentProps<typeof Ionicons>["name"];

type BottomTabBarProps = {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: never) => void };
};

const LOGO = require("../../assets/logo/logo.png");

const FULL_WIDTH = 224;
const RAIL_WIDTH = 72;
const ACTIVE_BG = "#FDE9F0";
const SOFT = "#5B6385";

function useDisplayName() {
  const { user } = useAuth();
  const displayName: string =
    (user as any)?.full_name ?? (user as any)?.name ?? "Account";
  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return { displayName, initials };
}

function NavRow({
  icon,
  label,
  active,
  badge,
  compact,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      {...({ title: label } as any)}
      style={(s: any) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 12,
        height: 40,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: active
          ? ACTIVE_BG
          : s.hovered
            ? "#F4F5FA"
            : "transparent",
      })}
    >
      <View>
        <Ionicons
          name={(active ? icon : `${icon}-outline`) as IconName}
          size={18}
          color={active ? colors.primary : SOFT}
        />
        {compact && badge ? (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
            }}
          />
        ) : null}
      </View>
      {compact ? null : (
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: active ? "600" : "500",
            color: active ? colors.primary : SOFT,
          }}
        >
          {label}
        </Text>
      )}
      {!compact && badge ? (
        <View
          style={{
            minWidth: 22,
            height: 20,
            paddingHorizontal: 6,
            borderRadius: 10,
            backgroundColor: "#FDF1D8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#B7791F" }}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function Sidebar({
  state,
  navigation,
  items,
  isAdmin,
  hoverExpand = false,
}: BottomTabBarProps & {
  items: NavItem[];
  isAdmin: boolean;
  hoverExpand?: boolean;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const { displayName, initials } = useDisplayName();
  const active = state.routes[state.index]?.name;

  const [expanded, setExpanded] = useState(false);
  const widthAnim = useRef(new Animated.Value(RAIL_WIDTH)).current;
  const setOpen = (open: boolean) => {
    setExpanded(open);
    Animated.timing(widthAnim, {
      toValue: open ? FULL_WIDTH : RAIL_WIDTH,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };
  const compact = !(hoverExpand && expanded);

  return (
    <View style={{ width: RAIL_WIDTH, zIndex: 50 }}>
      <Animated.View
        {...(hoverExpand
          ? ({
              onMouseEnter: () => setOpen(true),
              onMouseLeave: () => setOpen(false),
            } as any)
          : {})}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: widthAnim,
          backgroundColor: "#FFFFFF",
          borderRightWidth: 1,
          borderRightColor: colors.border,
          paddingTop: 24,
          paddingBottom: 16,
          paddingHorizontal: 12,
          justifyContent: "space-between",
          overflow: "hidden",
          ...(hoverExpand && expanded
            ? ({ boxShadow: "4px 0 24px rgba(20,24,56,0.08)" } as any)
            : null),
        }}
      >
        <View>
          <Pressable
            onPress={() => hoverExpand && setOpen(!expanded)}
            style={{
              height: 64,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            {compact ? (
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "800",
                  fontSize: 22,
                  letterSpacing: 1,
                }}
              >
                GC
              </Text>
            ) : (
              <Image
                source={LOGO}
                resizeMode="contain"
                style={{ width: 200, height: 64 }}
              />
            )}
          </Pressable>

          {compact ? null : (
            <Text
              style={{
                color: colors.muted,
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 1,
                paddingHorizontal: 12,
                marginBottom: 8,
              }}
            >
              WORKSPACE
            </Text>
          )}

          <View style={{ gap: 4 }}>
            {items.map((it) => (
              <NavRow
                key={it.name}
                icon={it.icon}
                label={it.label}
                badge={it.badge}
                compact={compact}
                active={active === it.name}
                onPress={() => navigation.navigate(it.name as never)}
              />
            ))}
          </View>
        </View>

        <View>
          <View style={{ gap: 4, marginBottom: 12 }}>
            {isAdmin ? (
              <NavRow
                icon="settings"
                label="Settings"
                compact={compact}
                active={active === "settings"}
                onPress={() => router.push("/settings" as any)}
              />
            ) : null}
            <NavRow
              icon="log-out"
              label="Sign out"
              compact={compact}
              active={false}
              onPress={() => {
                logout();
              }}
            />
          </View>

          <Pressable
            onPress={() => navigation.navigate("profile" as never)}
            style={(s: any) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 10,
              paddingTop: 14,
              paddingHorizontal: 6,
              paddingBottom: 4,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              opacity: s.hovered ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: ACTIVE_BG,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {initials}
              </Text>
            </View>
            {compact ? null : (
              <>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.navy,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ color: colors.muted, fontSize: 12 }}
                  >
                    {isAdmin ? "Administrator" : "Employee"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.muted}
                />
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

export function BottomNav({
  state,
  navigation,
  items,
  isAdmin,
}: BottomTabBarProps & { items: NavItem[]; isAdmin: boolean }) {
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName, initials } = useDisplayName();
  const [open, setOpen] = useState(false);
  const active = state.routes[state.index]?.name;

  const primary = items.slice(0, 4);
  const overflow: NavItem[] = [
    ...items.slice(4),
    ...(isAdmin
      ? [{ name: "profile", label: "Profile", icon: "person" } as NavItem]
      : []),
  ];
  const moreActive =
    open ||
    (!!active &&
      !primary.some((p) => p.name === active) &&
      overflow.some((o) => o.name === active));
  const moreBadge = overflow.some((o) => o.badge);

  const go = (name: string) => {
    setOpen(false);
    navigation.navigate(name as never);
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 6,
        }}
      >
        {primary.map((it) => {
          const on = active === it.name;
          return (
            <Pressable
              key={it.name}
              onPress={() => go(it.name)}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 3,
                paddingVertical: 4,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: on ? ACTIVE_BG : "transparent",
                }}
              >
                <Ionicons
                  name={(on ? it.icon : `${it.icon}-outline`) as IconName}
                  size={22}
                  color={on ? colors.primary : SOFT}
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: on ? "700" : "500",
                  color: on ? colors.primary : SOFT,
                }}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setOpen(true)}
          style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: moreActive ? ACTIVE_BG : "transparent",
            }}
          >
            <Ionicons
              name="grid-outline"
              size={22}
              color={moreActive ? colors.primary : SOFT}
            />
            {moreBadge ? (
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  right: 12,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                }}
              />
            ) : null}
          </View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: moreActive ? "700" : "500",
              color: moreActive ? colors.primary : SOFT,
            }}
          >
            More
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(20,24,56,0.35)" }}
        />
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 10,
            paddingHorizontal: 12,
            paddingBottom: Math.max(insets.bottom, 12) + 4,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 14,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 8,
              paddingBottom: 14,
              marginBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: ACTIVE_BG,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ color: colors.navy, fontWeight: "600", fontSize: 14 }}
              >
                {displayName}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {isAdmin ? "Administrator" : "Employee"}
              </Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            {overflow.map((it) => (
              <NavRow
                key={it.name}
                icon={it.icon}
                label={it.label}
                badge={it.badge}
                active={active === it.name}
                onPress={() => go(it.name)}
              />
            ))}
            {isAdmin ? (
              <NavRow
                icon="settings"
                label="Settings"
                active={active === "settings"}
                onPress={() => {
                  setOpen(false);
                  router.push("/settings" as any);
                }}
              />
            ) : null}
            <NavRow
              icon="log-out"
              label="Sign out"
              active={false}
              onPress={() => {
                setOpen(false);
                logout();
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
