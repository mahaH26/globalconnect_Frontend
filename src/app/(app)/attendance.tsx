import { Center } from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
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
    ? new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

export default function AttendanceScreen() {
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

  const header = (
    <View>
      <Text>Attendance</Text>
      {error && <Text>{error}</Text>}
      {summary && (
        <View>
          <Text>Month: {summary.month}</Text>
          <Text>Attendance rate: {summary.attendance_rate ?? "-"}%</Text>
          <Text>Expected days: {summary.expected_days}</Text>
          <Text>Present: {summary.present}</Text>
          <Text>Late: {summary.late}</Text>
          <Text>Absent: {summary.absent}</Text>
          <Text>On leave: {summary.on_leave_days}</Text>
          <Text>Early checkouts: {summary.early_checkouts}</Text>
          <Text>Overtime (min): {summary.overtime_minutes}</Text>
          <Text>Points this month: {summary.points_this_month}</Text>
          <Text>Total points: {summary.total_points}</Text>
        </View>
      )}
      <Text>History</Text>
    </View>
  );

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text>No attendance records yet.</Text>}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
      renderItem={({ item }) => (
        <View>
          <Text>
            {item.work_date} - {item.status}
          </Text>
          <Text>
            In: {time(item.check_in)} | Out: {time(item.check_out)}
          </Text>
          <Text>
            Points: {item.points_awarded}
            {item.early_checkout ? " | Early checkout" : ""}
            {item.overtime_minutes > 0
              ? ` | Overtime ${item.overtime_minutes} min`
              : ""}
          </Text>
        </View>
      )}
    />
  );
}
