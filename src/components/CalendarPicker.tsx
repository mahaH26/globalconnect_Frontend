import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const SOFT = "#5B6385";

const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Bahrain is UTC+3 all year
const todayBahrain = () =>
  new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

const parse = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};

/** "Fri, 16 Oct 2026" */
export const formatLong = (v: string) => {
  const p = parse(v);
  if (!p) return "";
  return new Date(Date.UTC(p.y, p.m, p.d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

function NavCircle({
  icon,
  onPress,
  label,
}: {
  icon: "chevron-back" | "chevron-forward";
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={(s: any) => ({
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: s.hovered ? "#F4F5FA" : "transparent",
      })}
    >
      <Ionicons name={icon} size={18} color={SOFT} />
    </Pressable>
  );
}

/**
 * A date button that opens a month calendar.
 * value is "YYYY-MM-DD" (or "" when allowClear is on and nothing is picked).
 */
export default function CalendarPicker({
  value,
  onChange,
  allowClear = false,
  emptyLabel = "Pick a date",
}: {
  value: string;
  onChange: (v: string) => void;
  allowClear?: boolean;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = todayBahrain();
  const start = parse(value) ?? parse(today)!;
  const [view, setView] = useState({ y: start.y, m: start.m });

  const openPicker = () => {
    const p = parse(value) ?? parse(today)!;
    setView({ y: p.y, m: p.m });
    setOpen(true);
  };

  const moveMonth = (delta: number) =>
    setView((v) => {
      const t = v.m + delta;
      return { y: v.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const firstDow = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const dim = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={(s: any) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: s.hovered ? "#D3D7EA" : colors.border,
          backgroundColor: "#FFFFFF",
        })}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: "600",
            color: value ? colors.text : colors.muted,
          }}
        >
          {value ? formatLong(value) : emptyLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Pressable
            onPress={() => setOpen(false)}
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "rgba(20,24,56,0.35)" },
            ]}
          />
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              gap: 10,
            }}
          >
            {/* Month header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <NavCircle
                icon="chevron-back"
                label="Previous month"
                onPress={() => moveMonth(-1)}
              />
              <Text
                style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}
              >
                {MONTHS[view.m]} {view.y}
              </Text>
              <NavCircle
                icon="chevron-forward"
                label="Next month"
                onPress={() => moveMonth(1)}
              />
            </View>

            {/* Weekday labels */}
            <View style={{ flexDirection: "row" }}>
              {WEEKDAYS.map((w, i) => (
                <Text
                  key={i}
                  style={{
                    width: `${100 / 7}%`,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "600",
                    color: i >= 5 ? "#A5AAC8" : colors.muted,
                  }}
                >
                  {w}
                </Text>
              ))}
            </View>

            {/* Days */}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {cells.map((d, i) => {
                if (d == null)
                  return (
                    <View
                      key={i}
                      style={{ width: `${100 / 7}%`, height: 40 }}
                    />
                  );
                const k = key(view.y, view.m, d);
                const selected = k === value;
                const isToday = k === today;
                return (
                  <View
                    key={i}
                    style={{
                      width: `${100 / 7}%`,
                      height: 40,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Pressable
                      onPress={() => pick(k)}
                      style={(s: any) => ({
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected
                          ? colors.primary
                          : s.hovered
                            ? colors.accentSoft
                            : "transparent",
                        borderWidth: isToday && !selected ? 1 : 0,
                        borderColor: colors.primary,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: selected || isToday ? "700" : "500",
                          color: selected
                            ? "#fff"
                            : isToday
                              ? colors.primary
                              : colors.text,
                        }}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 10,
              }}
            >
              <Pressable onPress={() => pick(today)} hitSlop={8}>
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Today
                </Text>
              </Pressable>
              {allowClear ? (
                <Pressable onPress={() => pick("")} hitSlop={8}>
                  <Text
                    style={{ color: SOFT, fontWeight: "600", fontSize: 13 }}
                  >
                    Show latest
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={{ color: SOFT, fontWeight: "600", fontSize: 13 }}>
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
