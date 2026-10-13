import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api } from "@/lib/api";
import {
  Card,
  ErrorText,
  Muted,
  Screen,
  Stat,
  StatGrid,
  Title,
} from "@/components/ui";
import { colors } from "@/theme";

interface Month {
  month: string;
  present: number;
  late: number;
  absent: number;
  early_checkouts: number;
  overtime_minutes: number;
  points: number;
  worked_minutes: number;
  attendance_rate: number | null;
  on_time_rate: number | null;
}

interface Insights {
  range_months: number;
  months: Month[];
  totals: {
    present: number;
    late: number;
    absent: number;
    early_checkouts: number;
    overtime_minutes: number;
    points: number;
    worked_minutes: number;
    days_tracked: number;
    attendance_rate: number | null;
    on_time_rate: number | null;
    avg_check_in_minutes: number | null;
    avg_hours_per_day: number | null;
    longest_on_time_streak: number;
    current_on_time_streak: number;
    first_record: string | null;
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (k: string) => MONTHS[Number(k.slice(5, 7)) - 1];

const hm = (min: number) => `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`;
const clock = (min: number | null) =>
  min === null
    ? "-"
    : `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function Bar({
  label,
  value,
  max,
  text,
  color,
}: {
  label: string;
  value: number | null;
  max: number;
  text: string;
  color: string;
}) {
  const width = value === null || max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ width: 36, color: colors.muted, fontSize: 12 }}>{label}</Text>
      <View
        style={{
          flex: 1,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.navySoft,
          overflow: "hidden",
        }}
      >
        <View style={{ width: `${width}%` as any, height: 10, backgroundColor: color }} />
      </View>
      <Text style={{ width: 64, textAlign: "right", color: colors.text, fontSize: 12 }}>
        {text}
      </Text>
    </View>
  );
}

const heading = (t: string) => (
  <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>{t}</Text>
);

export default function InsightsScreen() {
  const [data, setData] = useState<Insights | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api<Insights>("/insights/me?months=6"));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load insights");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  const months = data?.months ?? [];
  const maxOvertime = Math.max(0, ...months.map((m) => m.overtime_minutes));

  const withRate = months.filter((m) => m.on_time_rate !== null);
  let trend = "Not enough data yet to show a punctuality trend.";
  if (withRate.length >= 2) {
    const last = withRate[withRate.length - 1];
    const prev = withRate[withRate.length - 2];
    const diff = Math.round((last.on_time_rate! - prev.on_time_rate!) * 10) / 10;
    trend =
      diff > 0
        ? `Your punctuality improved by ${diff} points in ${monthLabel(last.month)} compared with ${monthLabel(prev.month)}.`
        : diff < 0
          ? `Your punctuality dropped by ${Math.abs(diff)} points in ${monthLabel(last.month)} compared with ${monthLabel(prev.month)}.`
          : `Your punctuality is unchanged from ${monthLabel(prev.month)}.`;
  }

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title>My insights</Title>
      <ErrorText>{error}</ErrorText>

      {t ? (
        <>
          <Muted>Last {data!.range_months} months</Muted>
          <StatGrid>
            <Stat
              label="Attendance"
              value={t.attendance_rate === null ? "-" : `${t.attendance_rate}%`}
              tone="good"
            />
            <Stat
              label="On time"
              value={t.on_time_rate === null ? "-" : `${t.on_time_rate}%`}
              tone="good"
            />
            <Stat label="Overtime" value={hm(t.overtime_minutes)} />
            <Stat label="Points" value={t.points} />
          </StatGrid>

          {heading("Attendance by month")}
          <Card>
            {months.map((m) => (
              <Bar
                key={m.month}
                label={monthLabel(m.month)}
                value={m.attendance_rate}
                max={100}
                text={m.attendance_rate === null ? "-" : `${m.attendance_rate}%`}
                color={colors.success}
              />
            ))}
          </Card>

          {heading("Punctuality trend")}
          <Card>
            {months.map((m) => (
              <Bar
                key={m.month}
                label={monthLabel(m.month)}
                value={m.on_time_rate}
                max={100}
                text={m.on_time_rate === null ? "-" : `${m.on_time_rate}%`}
                color={colors.primary}
              />
            ))}
            <Muted>{trend}</Muted>
          </Card>

          {heading("Overtime by month")}
          <Card>
            {months.map((m) => (
              <Bar
                key={m.month}
                label={monthLabel(m.month)}
                value={m.overtime_minutes}
                max={maxOvertime}
                text={hm(m.overtime_minutes)}
                color={colors.navy}
              />
            ))}
          </Card>

          {heading("Monthly progress")}
          <Card>
            {months.map((m) => (
              <View key={m.month} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "700", color: colors.text }}>{monthLabel(m.month)}</Text>
                <Muted>
                  {m.present} on time · {m.late} late · {m.absent} absent · {m.points} pts
                </Muted>
              </View>
            ))}
          </Card>

          {heading("Work history summary")}
          <Card>
            <Muted>Days tracked: {t.days_tracked}</Muted>
            <Muted>First record: {t.first_record ?? "-"}</Muted>
            <Muted>
              Present {t.present} · Late {t.late} · Absent {t.absent}
            </Muted>
            <Muted>Early checkouts: {t.early_checkouts}</Muted>
            <Muted>Average check-in: {clock(t.avg_check_in_minutes)}</Muted>
            <Muted>
              Average hours per day: {t.avg_hours_per_day === null ? "-" : `${t.avg_hours_per_day}h`}
            </Muted>
            <Muted>Total hours worked: {hm(t.worked_minutes)}</Muted>
            <Muted>
              On-time streak: {t.current_on_time_streak} days (best {t.longest_on_time_streak})
            </Muted>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}