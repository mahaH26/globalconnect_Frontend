import { colors, radius } from "@/theme";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
// Bahrain is UTC+3 all year
const todayIso = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

const parse = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
};
const pretty = (s: string) => {
  const p = parse(s);
  return p ? `${p.d} ${MONTHS[p.m].slice(0, 3)} ${p.y}` : "";
};

/**
 * Tap-to-pick date field with a calendar popup. Works the same on web, Android and iOS.
 * value / onChange use "YYYY-MM-DD" ("" = no date).
 */
export default function DateField({
  label,
  value,
  onChange,
  placeholder = "Select a date",
  minDate,
  half,
  containerStyle,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minDate?: string;
  half?: boolean;
  containerStyle?: ViewStyle;
}) {
  const [open, setOpen] = useState(false);
  const initial = parse(value) ?? parse(todayIso())!;
  const [year, setYear] = useState(initial.y);
  const [month, setMonth] = useState(initial.m);

  const show = () => {
    const s = parse(value) ?? parse(todayIso())!;
    setYear(s.y);
    setMonth(s.m);
    setOpen(true);
  };

  const moveMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  };

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = todayIso();

  const pick = (d: number) => {
    onChange(toIso(year, month, d));
    setOpen(false);
  };

  return (
    <View
      style={[
        { gap: 6 },
        half && { flexGrow: 1, flexBasis: 240, minWidth: 0 },
        containerStyle,
      ]}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable onPress={show} style={styles.input}>
        <Text style={{ color: value ? colors.text : colors.muted, fontSize: 15 }}>
          {value ? pretty(value) : placeholder}
        </Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.head}>
              <Pressable onPress={() => moveMonth(-12)} style={styles.nav}>
                <Text style={styles.navText}>«</Text>
              </Pressable>
              <Pressable onPress={() => moveMonth(-1)} style={styles.nav}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable onPress={() => moveMonth(1)} style={styles.nav}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
              <Pressable onPress={() => moveMonth(12)} style={styles.nav}>
                <Text style={styles.navText}>»</Text>
              </Pressable>
            </View>

            <View style={styles.week}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekday}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (d === null) return <View key={`b${i}`} style={styles.cell} />;
                const iso = toIso(year, month, d);
                const disabled = !!minDate && iso < minDate;
                const selected = iso === value;
                const isToday = iso === today;
                return (
                  <Pressable
                    key={iso}
                    disabled={disabled}
                    onPress={() => pick(d)}
                    style={styles.cell}
                  >
                    <View
                      style={[
                        styles.day,
                        selected && { backgroundColor: colors.primary },
                        !selected && isToday && { borderWidth: 1.5, borderColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={{
                          fontWeight: selected || isToday ? "800" : "500",
                          color: selected ? "#fff" : disabled ? colors.border : colors.text,
                        }}
                      >
                        {d}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={() => {
                  onChange(today);
                  setOpen(false);
                }}
              >
                <Text style={styles.link}>Today</Text>
              </Pressable>
              {value ? (
                <Pressable
                  onPress={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.link, { color: colors.danger }]}>Clear</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setOpen(false)}>
                <Text style={[styles.link, { color: colors.muted }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: colors.muted },
  input: {
    backgroundColor: colors.field,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20,24,60,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 4 },
  nav: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: { color: colors.navy, fontSize: 18, fontWeight: "700" },
  monthTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "800",
    color: colors.text,
    fontSize: 15,
  },
  week: { flexDirection: "row" },
  weekday: {
    width: "14.2857%",
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "14.2857%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  day: {
    width: "86%",
    height: "86%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  link: { color: colors.primary, fontWeight: "700", fontSize: 14 },
});