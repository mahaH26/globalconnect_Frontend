import {
  Avatar,
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  ErrorText,
  Field,
  Muted,
  Row,
  Stat,
  StatGrid,
  Title,
  listContent,
  listStyle,
  toneFor,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";

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

export default function TeamAttendanceScreen() {
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

  const lateCount = rows.filter((r) => r.status === "late").length;

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={listContent}
      data={rows}
      keyExtractor={(r) => String(r.id)}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 14 }}>
          <Title>Team attendance</Title>
          <Row>
            <Button small variant="secondary" title="‹" onPress={() => setDate(shift(date, -1))} />
            <Field
              containerStyle={{ flex: 1 }}
              placeholder="YYYY-MM-DD (empty = latest)"
              value={date}
              onChangeText={setDate}
              autoCapitalize="none"
              style={{ textAlign: "center" }}
            />
            <Button small variant="secondary" title="›" onPress={() => setDate(shift(date, 1))} />
          </Row>
          <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <Chips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            <Button small variant="ghost" title="Today" onPress={() => setDate(todayBahrain())} />
          </Row>
          <StatGrid>
            <Stat label="Records" value={rows.length} />
            <Stat label="Late" value={lateCount} tone="warn" />
          </StatGrid>
          <ErrorText>{error}</ErrorText>
        </View>
      }
      ListEmptyComponent={<Empty text="No records for this filter." />}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={item.profiles?.full_name} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }} numberOfLines={1}>
              {item.profiles?.full_name ?? "Employee"}
            </Text>
            <Muted>
              In {time(item.check_in)} · Out {time(item.check_out)}
            </Muted>
            <Muted>
              {item.work_date} · {item.profiles?.departments?.name ?? "No department"} ·{" "}
              {item.points_awarded} pts
              {item.early_checkout ? " · early checkout" : ""}
              {item.overtime_minutes > 0 ? ` · +${item.overtime_minutes} min` : ""}
            </Muted>
          </View>
          <Badge text={item.status} tone={toneFor(item.status)} />
        </Card>
      )}
    />
  );
}