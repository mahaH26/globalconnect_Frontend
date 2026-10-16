import { formatLong } from "@/components/CalendarPicker";
import {
  Badge,
  Card,
  Center,
  Empty,
  ErrorText,
  Muted,
  PageHeader,
  Row,
  Section,
  Stat,
  StatGrid,
  listContent,
  listStyle,
  toneFor,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

interface AttendanceRecord {
  id: string;
  work_date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  early_checkout: boolean;
  overtime_minutes: number;
  points_awarded: number;
}

interface Summary {
  month: string;
  expected_days: number;
  present: number;
  late: number;
  absent: number;
  on_leave_days: number;
  early_checkouts: number;
  overtime_minutes: number;
  points_this_month: number;
  total_points: number;
  attendance_rate: number | null;
}

const time = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bahrain",
      })
    : "--:--";

export default function AttendanceScreen() {
  const { width } = useWindowDimensions();
  // Two cards per row on desktop, one on iPad / phone
  const cols = width >= 1000 ? 2 : 1;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [rows, sum] = await Promise.all([
        api<AttendanceRecord[]>("/attendance/me"),
        api<Summary>("/attendance/me/summary"),
      ]);
      setRecords(rows);
      setSummary(sum);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load attendance");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Center>
        <ActivityIndicator size="large" color={colors.primary} />
      </Center>
    );
  }

  const rate = summary?.attendance_rate ?? null;

  const header = (
    <View style={{ gap: 16, marginBottom: 8 }}>
      <PageHeader
        title="Attendance"
        subtitle={summary ? `Summary for ${summary.month}` : undefined}
      />
      <ErrorText>{error}</ErrorText>

      {summary ? (
        <>
          <View
            style={{
              backgroundColor: colors.navy,
              borderRadius: 16,
              padding: 22,
              gap: 14,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              Attendance rate
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
            >
              <Text style={{ color: "#fff", fontSize: 44, fontWeight: "700" }}>
                {rate == null ? "-" : rate}
                {rate == null ? null : <Text style={{ fontSize: 24 }}>%</Text>}
              </Text>
              <Text style={{ color: "#9AA0C9", fontSize: 12 }}>this month</Text>
            </View>
            <Text style={{ color: "#C9CDE8", fontSize: 13 }}>
              {summary.present} present · {summary.late} late · {summary.absent}{" "}
              absent
            </Text>
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.min(100, Math.max(0, rate ?? 0))}%`,
                  height: 4,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </View>

          <StatGrid>
            <Stat label="Expected days" value={summary.expected_days} />
            <Stat label="Present" value={summary.present} tone="good" />
            <Stat label="Late" value={summary.late} tone="warn" />
            <Stat label="Absent" value={summary.absent} tone="bad" />
            <Stat label="On leave" value={summary.on_leave_days} />
            <Stat label="Early checkouts" value={summary.early_checkouts} />
            <Stat label="Overtime (min)" value={summary.overtime_minutes} />
            <Stat
              label="Points this month"
              value={summary.points_this_month}
              tone="good"
            />
            <Stat label="Total points" value={summary.total_points} />
          </StatGrid>
        </>
      ) : null}

      <Section title="History" />
    </View>
  );

  return (
    <FlatList
      key={cols} // numColumns can't change on a mounted list
      style={listStyle}
      contentContainerStyle={listContent}
      data={records}
      numColumns={cols}
      columnWrapperStyle={cols > 1 ? { marginHorizontal: -8 } : undefined}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={<Empty text="No attendance records yet." />}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      renderItem={({ item }) => (
        <View
          style={{
            flex: 1,
            maxWidth: `${100 / cols}%`,
            paddingHorizontal: cols > 1 ? 8 : 0,
            paddingVertical: 5,
          }}
        >
          <Card style={{ padding: 16, gap: 10 }}>
            <Row style={{ justifyContent: "space-between", gap: 8 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.text,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {formatLong(item.work_date) || item.work_date}
              </Text>
              <Badge text={item.status} tone={toneFor(item.status)} />
            </Row>
            <Row style={{ gap: 16, flexWrap: "wrap" }}>
              <Row style={{ gap: 6 }}>
                <Ionicons
                  name="log-in-outline"
                  size={15}
                  color={colors.muted}
                />
                <Muted>In {time(item.check_in)}</Muted>
              </Row>
              <Row style={{ gap: 6 }}>
                <Ionicons
                  name="log-out-outline"
                  size={15}
                  color={colors.muted}
                />
                <Muted>Out {time(item.check_out)}</Muted>
              </Row>
            </Row>
            <Muted>
              {item.points_awarded} pts
              {item.early_checkout ? " · early checkout" : ""}
              {item.overtime_minutes > 0
                ? ` · +${item.overtime_minutes} min overtime`
                : ""}
            </Muted>
          </Card>
        </View>
      )}
    />
  );
}
