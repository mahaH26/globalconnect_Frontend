import React, { useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native";
import { colors, radius, shadow } from "@/theme";

export type Tone = "good" | "warn" | "bad" | "info" | "neutral";

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  good: { bg: colors.successSoft, fg: colors.success },
  warn: { bg: colors.warningSoft, fg: colors.warning },
  bad: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.navySoft, fg: colors.navy },
  neutral: { bg: colors.field, fg: colors.muted },
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

// ---- layout helpers for FlatList screens ----
export const listStyle: ViewStyle = { flex: 1, backgroundColor: colors.bg };
export const listContent: ViewStyle = {
  padding: 16,
  paddingBottom: 40,
  width: "100%",
  maxWidth: 900,
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
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.screenContent}
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

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
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
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  small?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : variant === "secondary"
          ? colors.navySoft
          : "transparent";
  const fg =
    variant === "secondary"
      ? colors.navy
      : variant === "ghost"
        ? colors.primary
        : colors.primaryText;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor: bg,
          opacity: disabled || loading ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: fg }]}>
          {title}
        </Text>
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
  const t = toneColors[tone];
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: radius.sm, padding: 12 }}>
      <Text style={{ color: t.fg, fontSize: 14, fontWeight: "600" }}>{children}</Text>
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
  return (
    <View style={{ alignItems: "center", paddingVertical: 40 }}>
      <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function Badge({ text, tone = "neutral" }: { text: string; tone?: Tone }) {
  const t = toneColors[tone];
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
      <Text style={{ color: t.fg, fontSize: 12, fontWeight: "700", textTransform: "capitalize" }}>
        {text}
      </Text>
    </View>
  );
}

export function Avatar({
  name,
  size = 44,
  bg = colors.navy,
}: {
  name?: string | null;
  size?: number;
  bg?: string;
}) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

// ---- form pieces: filled inputs that sit directly on the screen (no boxed form) ----

const webReset = Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : null;

export function Field({
  label,
  half,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label?: string; half?: boolean; containerStyle?: ViewStyle }) {
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
        placeholderTextColor={colors.muted}
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
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{children}</View>;
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, style]}>
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
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && { color: "#fff" }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back}>
      <Text style={{ color: colors.navy, fontWeight: "700", fontSize: 14 }}>‹ Back</Text>
    </Pressable>
  );
}

export function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.muted, { flexShrink: 1, textTransform: "capitalize" }]}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
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
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.collapsible}>
      <Pressable onPress={() => setOpen(!open)} style={styles.collapsibleHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 18 }}>{open ? "▾" : "▸"}</Text>
      </Pressable>
      {open ? <View style={{ gap: 14, paddingBottom: 18 }}>{children}</View> : null}
    </View>
  );
}

// ---- quick action tiles (like the "Quick Actions" grid in the mobile design) ----

export function TileGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.tileGrid}>{children}</View>;
}

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
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}>
      <View
        style={[
          styles.tileIcon,
          { backgroundColor: accent ? colors.accentSoft : colors.navySoft },
        ]}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
        {badge ? (
          <View style={styles.tileBadge}>
            <Text style={styles.tileBadgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: 16, paddingBottom: 40, alignItems: "center" },
  screenInner: { width: "100%", maxWidth: 900, gap: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    gap: 8,
    ...shadow,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, flexShrink: 1 },
  muted: { fontSize: 14, color: colors.muted },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  sectionAction: { fontSize: 14, fontWeight: "600", color: colors.primary },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonSmall: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    minHeight: 38,
    alignSelf: "flex-start",
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    ...shadow,
  },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
  label: { fontSize: 13, fontWeight: "600", color: colors.muted },
  input: {
    backgroundColor: colors.field,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputFocus: { borderColor: colors.primary, backgroundColor: "#fff" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.field,
  },
  chipOn: { backgroundColor: colors.navy },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.text, textTransform: "capitalize" },
  back: {
    alignSelf: "flex-start",
    backgroundColor: colors.navySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  collapsibleHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  tileGrid: { flexDirection: "row", flexWrap: "wrap" },
  tile: { width: "25%", alignItems: "center", paddingVertical: 10, paddingHorizontal: 2, gap: 6 },
  tileIcon: {
    width: 54,
    height: 54,
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
  tileLabel: { fontSize: 12, color: colors.text, textAlign: "center", fontWeight: "600" },
});