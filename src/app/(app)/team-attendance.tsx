import { api } from "@/lib/api";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Row {
  id: string;
  work_date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  early_checkout: boolean;
  overtime_minutes: number;
  points_awarded: number;
  distance_m: number | null;
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

const STATUSES = ["", "present", "late"];

export default function TeamAttendanceScreen() {
  const [date, setDate] = useState(todayBahrain());
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const params: string[] = [];
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) params.push(`date=${date}`);
      if (status) params.push(`status=${status}`);
      const q = params.length ? `?${params.join("&")}` : "";
      setRows(await api<Row[]>(`/attendance${q}`));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load attendance");
    }
  }, [date, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const lateCount = rows.filter((r) => r.status === "late").length;

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => String(r.id)}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View>
          <Text>Team attendance</Text>
          <View>
            <TouchableOpacity onPress={() => setDate(shift(date, -1))}>
              <Text>{"< Previous day"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDate(shift(date, 1))}>
              <Text>{"Next day >"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDate(todayBahrain())}>
              <Text>Today</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Date (YYYY-MM-DD), empty = latest records"
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
          />
          <View>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s || "all"} onPress={() => setStatus(s)}>
                <Text>
                  {status === s ? "● " : "○ "}
                  {s || "all"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text>
            {rows.length} record(s), {lateCount} late
          </Text>
          {error && <Text>{error}</Text>}
        </View>
      }
      ListEmptyComponent={<Text>No records for this filter.</Text>}
      renderItem={({ item }) => (
        <View>
          <Text>
            {item.profiles?.full_name ?? "Employee"} - {item.status}
          </Text>
          <Text>
            {item.work_date} | In: {time(item.check_in)} | Out: {time(item.check_out)}
          </Text>
          <Text>
            {item.profiles?.departments?.name ?? "No department"} | Points:{" "}
            {item.points_awarded}
            {item.early_checkout ? " | Early checkout" : ""}
            {item.overtime_minutes > 0 ? ` | Overtime ${item.overtime_minutes} min` : ""}
          </Text>
        </View>
      )}
    />
  );
}