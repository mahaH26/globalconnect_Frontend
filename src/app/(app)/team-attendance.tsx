import CalendarPicker, { formatLong } from "@/components/CalendarPicker";
import {
  Avatar,
  Badge,
  Card,
  Chips,
  Empty,
  ErrorText,
  Muted,
  PageHeader,
  Row,
  Stat,
  StatGrid,
  listContent,
  listStyle,
  toneFor,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

interface AttRow {
  id: string;
  work_date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  early_checkout: boolean;
  overtime_minutes: number;
  points_awarded: number;
  profiles: {
    full_name: string;
    position: string | null;
    departments: { name: string } | null;
  } | null;
}

// Bahrain is UTC+3 all year
const todayBahrain = () =>
  new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

const shift = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

const time = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bahrain",
      })
    : "--:--";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
];

function ArrowButton({
  icon,
  label,
  onPress,
}: {
  icon: "chevron-back" | "chevron-forward";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={(s: any) => ({
        width: 44,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: s.hovered ? "#F4F5FA" : "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Ionicons name={icon} size={18} color={colors.navy} />
    </Pressable>
  );
}

export default function TeamAttendanceScreen() {
  const { width } = useWindowDimensions();
  // Two cards per row on desktop, one on iPad / phone
  const cols = width >= 1000 ? 2 : 1;

  const [date, setDate] = useState(todayBahrain());
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<AttRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const params: string[] = [];
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) params.push(`date=${date}`);
      if (status) params.push(`status=${status}`);
      const q = params.length ? `?${params.join("&")}` : "";
      setRows(await api<AttRow[]>(`/attendance${q}`));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load attendance");
    }
  }, [date, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const presentCount = rows.filter((r) => r.status === "present").length;
  const lateCount = rows.filter((r) => r.status === "late").length;
  const base = date || todayBahrain();

  return (
    <FlatList
      key={cols} // numColumns can't change on a mounted list
      style={listStyle}
      contentContainerStyle={listContent}
      data={rows}
      numColumns={cols}
      columnWrapperStyle={cols > 1 ? { marginHorizontal: -8 } : undefined}
      keyExtractor={(r) => String(r.id)}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 12 }}>
          <PageHeader
            title="Team attendance"
            subtitle={date ? formatLong(date) : "Latest records"}
          />

          {/* Date controls + filter: one row on desktop, wraps on smaller screens */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Row style={{ gap: 8, flexGrow: 1, flexBasis: 320, maxWidth: 460 }}>
              <ArrowButton
                icon="chevron-back"
                label="Previous day"
                onPress={() => setDate(shift(base, -1))}
              />
              <View style={{ flex: 1 }}>
                <CalendarPicker
                  value={date}
                  onChange={setDate}
                  allowClear
                  emptyLabel="Latest records"
                />
              </View>
              <ArrowButton
                icon="chevron-forward"
                label="Next day"
                onPress={() => setDate(shift(base, 1))}
              />
            </Row>
            <Chips
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
          </View>

          <StatGrid>
            <Stat label="Records" value={rows.length} />
            <Stat label="Present" value={presentCount} tone="good" />
            <Stat label="Late" value={lateCount} tone="warn" />
          </StatGrid>
          <ErrorText>{error}</ErrorText>
        </View>
      }
      ListEmptyComponent={<Empty text="No records for this filter." />}
      renderItem={({ item }) => (
        <View
          style={{
            flex: 1,
            maxWidth: `${100 / cols}%`,
            paddingHorizontal: cols > 1 ? 8 : 0,
            paddingVertical: 5,
          }}
        >
          <Card
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
            }}
          >
            <Avatar name={item.profiles?.full_name} size={40} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: colors.text }}
                numberOfLines={1}
              >
                {item.profiles?.full_name ?? "Employee"}
              </Text>
              <Row style={{ gap: 14, flexWrap: "wrap" }}>
                <Row style={{ gap: 5 }}>
                  <Ionicons
                    name="log-in-outline"
                    size={14}
                    color={colors.muted}
                  />
                  <Muted>{time(item.check_in)}</Muted>
                </Row>
                <Row style={{ gap: 5 }}>
                  <Ionicons
                    name="log-out-outline"
                    size={14}
                    color={colors.muted}
                  />
                  <Muted>{time(item.check_out)}</Muted>
                </Row>
              </Row>
              <Muted>
                {item.work_date} ·{" "}
                {item.profiles?.departments?.name ?? "No department"} ·{" "}
                {item.points_awarded} pts
                {item.early_checkout ? " · early checkout" : ""}
                {item.overtime_minutes > 0
                  ? ` · +${item.overtime_minutes} min`
                  : ""}
              </Muted>
            </View>
            <Badge text={item.status} tone={toneFor(item.status)} />
          </Card>
        </View>
      )}
    />
  );
}
