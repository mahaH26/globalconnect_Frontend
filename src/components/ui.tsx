import { colors, radius, themeVersion } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const isIcon = (n: string): n is IconName => n in Ionicons.glyphMap;

export type Tone = "good" | "warn" | "bad" | "info" | "neutral";

// Built on demand so it always reflects the current theme
const toneColors = (): Record<Tone, { bg: string; fg: string }> => ({
  good: { bg: colors.successSoft, fg: colors.success },
  warn: { bg: colors.warningSoft, fg: colors.warning },
  bad: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.navySoft, fg: colors.navyText },
  neutral: { bg: colors.navySoft, fg: colors.muted },
});

const toneIcons: Record<Tone, IconName> = {
  good: "checkmark-circle",
  warn: "warning",
  bad: "alert-circle",
  info: "information-circle",
  neutral: "information-circle",
};

/** Maps a status word (active, late, rejected...) to a badge colour */
export function toneFor(status: string): Tone {
  switch (status) {
    case "active":
    case "present":
    case "approved":
      return "good";
    case "probation":
    case "late":
    case "pending":
    case "suspended":
      return "warn";
    case "terminated":
    case "rejected":
    case "absent":
      return "bad";
    default:
      return "neutral";
  }
}

// ---- layout helpers for FlatList screens (getters keep them theme-aware) ----
export const listStyle: ViewStyle = {
  flex: 1,
  get backgroundColor() {
    return colors.bg;
  },
};
export const listContent: ViewStyle = {
  padding: 20,
  paddingBottom: 40,
  width: "100%",
  maxWidth: 1040,
  alignSelf: "center",
};

export function Screen({
  children,
  onRefresh,
  refreshing,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const styles = getStyles();
  const { width } = useWindowDimensions();
  const pad = width >= 700 ? 24 : 16;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: pad,
        paddingBottom: 48,
        alignItems: "center",
      }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <View style={styles.screenInner}>{children}</View>
    </ScrollView>
  );
}

/** Big page title with an optional subtitle and a right-aligned action */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const styles = getStyles();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 2,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.muted, { marginTop: 2 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const styles = getStyles();
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={(s: any) => [
          styles.card,
          style,
          s.hovered && { borderColor: colors.hoverBorder },
          s.pressed && { opacity: 0.9 },
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Heading used at the top of a Card */
export function CardTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const styles = getStyles();
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const styles = getStyles();
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  const styles = getStyles();
  return <Text style={styles.muted}>{children}</Text>;
}

export function Section({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const styles = getStyles();
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  small,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  small?: boolean;
  icon?: IconName;
  style?: ViewStyle;
}) {
  const styles = getStyles();
  const look = {
    primary: {
      bg: colors.primary,
      hover: colors.primaryHover,
      fg: colors.primaryText,
      border: "transparent",
    },
    secondary: {
      bg: colors.inputBg,
      hover: colors.hover,
      fg: colors.navyText,
      border: colors.border,
    },
    danger: {
      bg: colors.dangerSoft,
      hover: colors.dangerHover,
      fg: colors.danger,
      border: "transparent",
    },
    ghost: {
      bg: "transparent",
      hover: colors.accentSoft,
      fg: colors.primary,
      border: "transparent",
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={(s: any) => [
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor: s.hovered || s.pressed ? look.hover : look.bg,
          borderColor: look.border,
          opacity: disabled || loading ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={look.fg} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={small ? 15 : 17} color={look.fg} />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              small && { fontSize: 13 },
              { color: look.fg },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "warn" | "bad";
}) {
  const styles = getStyles();
  const color =
    tone === "good"
      ? colors.success
      : tone === "warn"
        ? colors.warning
        : tone === "bad"
          ? colors.danger
          : colors.text;
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  const styles = getStyles();
  return <View style={styles.grid}>{children}</View>;
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  const t = toneColors()[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: t.bg,
        borderRadius: radius.sm,
        paddingVertical: 11,
        paddingHorizontal: 14,
      }}
    >
      <Ionicons name={toneIcons[tone]} size={18} color={t.fg} />
      <Text style={{ flex: 1, color: t.fg, fontSize: 13, fontWeight: "600" }}>
        {children}
      </Text>
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  return <Notice tone="bad">{children}</Notice>;
}

export function Center({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.bg,
      }}
    >
      {children}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  const styles = getStyles();
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.navySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="file-tray-outline" size={26} color={colors.muted} />
      </View>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function Badge({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: Tone;
}) {
  const t = toneColors()[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: t.fg,
          fontSize: 12,
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {text}
      </Text>
    </View>
  );
}

/** Pale pink avatar with initials. Pass `bg` for a solid colour with white text. */
export function Avatar({
  name,
  size = 44,
  bg,
  uri,
}: {
  name?: string | null;
  size?: number;
  bg?: string;
  uri?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  React.useEffect(() => {
    setFailed(false);
  }, [uri]);
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        resizeMode="cover"
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accentSoft,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg ?? colors.accentSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: bg ? "#fff" : colors.primary,
          fontWeight: "700",
          fontSize: size * 0.36,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

// ---- form pieces ----

const webReset =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : null;
const focusRing =
  Platform.OS === "web"
    ? ({ boxShadow: "0 0 0 3px rgba(230,0,76,0.10)" } as any)
    : null;

export function Field({
  label,
  half,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  label?: string;
  half?: boolean;
  containerStyle?: ViewStyle;
}) {
  const styles = getStyles();
  const [focus, setFocus] = useState(false);
  return (
    <View
      style={[
        { gap: 6 },
        half && { flexGrow: 1, flexBasis: 240, minWidth: 0 },
        containerStyle,
      ]}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.placeholder}
        {...props}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          focus && styles.inputFocus,
          focus && focusRing,
          props.multiline && { minHeight: 84, textAlignVertical: "top" },
          webReset,
          style,
        ]}
      />
    </View>
  );
}

/** Puts fields side by side on wide screens and stacks them on phones */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
      {children}
    </View>
  );
}

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, style]}
    >
      {children}
    </View>
  );
}

export function chipOptions<T extends string>(arr: readonly T[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const styles = getStyles();
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value || "none"}
              onPress={() => onChange(o.value)}
              style={(s: any) => [
                styles.chip,
                s.hovered && !on && { backgroundColor: colors.hover },
                on && styles.chipOn,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  on && { color: colors.primary, fontWeight: "600" },
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  const styles = getStyles();
  return (
    <Pressable
      onPress={onPress}
      style={(s: any) => [
        styles.back,
        s.hovered && { backgroundColor: colors.hover },
      ]}
    >
      <Ionicons name="chevron-back" size={15} color={colors.navyText} />
      <Text style={{ color: colors.navyText, fontWeight: "600", fontSize: 13 }}>
        Back
      </Text>
    </Pressable>
  );
}

export function KV({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const styles = getStyles();
  return (
    <View style={styles.kv}>
      <Text
        style={[styles.muted, { flexShrink: 1, textTransform: "capitalize" }]}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontWeight: "600",
          fontSize: 14,
          flexShrink: 1,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const styles = getStyles();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.collapsible}>
      <Pressable onPress={() => setOpen(!open)} style={styles.collapsibleHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={open ? "chevron-down" : "chevron-forward"}
          size={16}
          color={colors.muted}
        />
      </Pressable>
      {open ? (
        <View style={{ gap: 14, paddingBottom: 18 }}>{children}</View>
      ) : null}
    </View>
  );
}

// ---- quick action tiles ----

export function TileGrid({ children }: { children: React.ReactNode }) {
  const styles = getStyles();
  return <View style={styles.tileGrid}>{children}</View>;
}

/** `icon` can be an Ionicons name ("calendar") or, as before, an emoji */
export function ActionTile({
  icon,
  label,
  onPress,
  badge,
  accent,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
  accent?: boolean;
}) {
  const styles = getStyles();
  const fg = accent ? colors.primary : colors.navyText;
  return (
    <Pressable
      onPress={onPress}
      style={(s: any) => [styles.tile, s.pressed && { opacity: 0.7 }]}
    >
      <View
        style={[
          styles.tileIcon,
          { backgroundColor: accent ? colors.accentSoft : colors.navySoft },
        ]}
      >
        {isIcon(icon) ? (
          <Ionicons name={icon} size={24} color={fg} />
        ) : (
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        )}
        {badge ? (
          <View style={styles.tileBadge}>
            <Text style={styles.tileBadgeText}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---- styles: rebuilt whenever the theme changes ----

const build = () =>
  StyleSheet.create({
    screenInner: { width: "100%", maxWidth: 1040, gap: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      gap: 8,
    },
    pageTitle: { fontSize: 26, fontWeight: "700", color: colors.text },
    cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      flexShrink: 1,
    },
    muted: { fontSize: 13, color: colors.muted },
    sectionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
    sectionAction: { fontSize: 13, fontWeight: "600", color: colors.primary },
    button: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 18,
      borderRadius: radius.sm,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
    },
    buttonSmall: {
      paddingHorizontal: 14,
      minHeight: 36,
      alignSelf: "flex-start",
    },
    buttonText: { fontSize: 14, fontWeight: "600" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    stat: {
      flexGrow: 1,
      flexBasis: 150,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    statValue: { fontSize: 26, fontWeight: "700" },
    statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
    label: { fontSize: 12, fontWeight: "600", color: colors.soft },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: radius.sm,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputFocus: { borderColor: colors.primary },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipOn: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentSoft,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.soft,
      textTransform: "capitalize",
    },
    back: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: 8,
      paddingRight: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    kv: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      paddingVertical: 4,
    },
    collapsible: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    collapsibleHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
    },
    tileGrid: { flexDirection: "row", flexWrap: "wrap" },
    tile: {
      width: "25%",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 2,
      gap: 6,
    },
    tileIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    tileBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    tileBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    tileLabel: {
      fontSize: 12,
      color: colors.text,
      textAlign: "center",
      fontWeight: "600",
    },
  });

let cache: { v: number; s: ReturnType<typeof build> } | null = null;
function getStyles() {
  const v = themeVersion();
  if (!cache || cache.v !== v) cache = { v, s: build() };
  return cache.s;
}
