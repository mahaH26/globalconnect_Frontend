import {
  Card,
  CardTitle,
  Divider,
  ErrorText,
  KV,
  Muted,
  PageHeader,
  Screen,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthLabel = (k: string) => MONTHS[Number(k.slice(5, 7)) - 1];

const hm = (min: number) => `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`;
const clock = (min: number | null) =>
  min === null
    ? "-"
    : `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const TONES = {
  neutral: { fg: "#5B6385", bg: "#EEF0F7" },
  good: { fg: "#16A34A", bg: "#E6F6EC" },
  warn: { fg: "#D97706", bg: "#FDF1D8" },
  bad: { fg: "#E11D48", bg: "#FDE7EC" },
} as const;
type Tone = keyof typeof TONES;

function StatTile({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: IconName;
  tone?: Tone;
}) {
  return (
    <Card style={{ padding: 16, gap: 0 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: tone === "neutral" ? colors.text : TONES[tone].fg,
            fontSize: 26,
            fontWeight: "700",
          }}
        >
          {value}
        </Text>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: TONES[tone].bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={16} color={TONES[tone].fg} />
        </View>
      </View>
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>
        {label}
      </Text>
    </Card>
  );
}

/** Minimal column chart: one bar per month, value above, month below */
function MonthBars({
  items,
  max,
  color,
}: {
  items: { label: string; value: number | null; text: string }[];
  max: number;
  color: string;
}) {
  const H = 120;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
        height: H + 46,
      }}
    >
      {items.map((i) => {
        const has = i.value !== null && i.value > 0 && max > 0;
        return (
          <View
            key={i.label}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 6,
            }}
          >
            <Text
              style={{ fontSize: 11, fontWeight: "600", color: colors.text }}
            >
              {i.text}
            </Text>
            <View
              style={{
                width: "60%",
                maxWidth: 36,
                height: has ? Math.max(4, ((i.value as number) / max) * H) : 4,
                backgroundColor: has ? color : colors.navySoft,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
              }}
            />
            <Text style={{ fontSize: 11, color: colors.muted }}>{i.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function InsightsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const cols = width >= 700 ? 4 : 2;

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
  let trendIcon: IconName = "remove-outline";
  let trendTone: Tone = "neutral";
  if (withRate.length >= 2) {
    const last = withRate[withRate.length - 1];
    const prev = withRate[withRate.length - 2];
    const diff =
      Math.round((last.on_time_rate! - prev.on_time_rate!) * 10) / 10;
    if (diff > 0) {
      trend = `Your punctuality improved by ${diff} points in ${monthLabel(last.month)} compared with ${monthLabel(prev.month)}.`;
      trendIcon = "trending-up";
      trendTone = "good";
    } else if (diff < 0) {
      trend = `Your punctuality dropped by ${Math.abs(diff)} points in ${monthLabel(last.month)} compared with ${monthLabel(prev.month)}.`;
      trendIcon = "trending-down";
      trendTone = "bad";
    } else {
      trend = `Your punctuality is unchanged from ${monthLabel(prev.month)}.`;
    }
  }

  const attendanceChart = (
    <Card style={{ gap: 16 }}>
      <CardTitle
        title="Attendance by month"
        subtitle="Share of expected days attended"
      />
      <MonthBars
        max={100}
        color={colors.success}
        items={months.map((m) => ({
          label: monthLabel(m.month),
          value: m.attendance_rate,
          text: m.attendance_rate === null ? "-" : `${m.attendance_rate}%`,
        }))}
      />
    </Card>
  );

  const punctualityChart = (
    <Card style={{ gap: 16 }}>
      <CardTitle
        title="Punctuality trend"
        subtitle="Share of check-ins that were on time"
      />
      <MonthBars
        max={100}
        color={colors.primary}
        items={months.map((m) => ({
          label: monthLabel(m.month),
          value: m.on_time_rate,
          text: m.on_time_rate === null ? "-" : `${m.on_time_rate}%`,
        }))}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: TONES[trendTone].bg,
          borderRadius: 10,
          padding: 12,
        }}
      >
        <Ionicons name={trendIcon} size={18} color={TONES[trendTone].fg} />
        <Text
          style={{
            flex: 1,
            color: TONES[trendTone].fg,
            fontSize: 13,
            fontWeight: "500",
          }}
        >
          {trend}
        </Text>
      </View>
    </Card>
  );

  const overtimeChart = (
    <Card style={{ gap: 16 }}>
      <CardTitle
        title="Overtime by month"
        subtitle="Extra time worked beyond your hours"
      />
      <MonthBars
        max={maxOvertime}
        color={colors.navy}
        items={months.map((m) => ({
          label: monthLabel(m.month),
          value: m.overtime_minutes,
          text: hm(m.overtime_minutes),
        }))}
      />
    </Card>
  );

  const summaryCard = t ? (
    <Card style={{ gap: 6 }}>
      <CardTitle title="Work history summary" />
      <View style={{ marginTop: 6 }}>
        <KV label="Days tracked" value={t.days_tracked} />
        <KV label="First record" value={t.first_record ?? "-"} />
        <KV
          label="Present / late / absent"
          value={`${t.present} / ${t.late} / ${t.absent}`}
        />
        <KV label="Early checkouts" value={t.early_checkouts} />
        <KV label="Average check-in" value={clock(t.avg_check_in_minutes)} />
        <KV
          label="Average hours per day"
          value={t.avg_hours_per_day === null ? "-" : `${t.avg_hours_per_day}h`}
        />
        <KV label="Total hours worked" value={hm(t.worked_minutes)} />
        <KV
          label="On-time streak"
          value={`${t.current_on_time_streak} days (best ${t.longest_on_time_streak})`}
        />
      </View>
    </Card>
  ) : null;

  const monthlyCard = (
    <Card style={{ gap: 12 }}>
      <CardTitle title="Monthly progress" />
      <View style={{ flexDirection: "row", paddingBottom: 2 }}>
        <Text
          style={{
            flex: 1.2,
            color: colors.muted,
            fontSize: 12,
            fontWeight: "600",
          }}
        >
          Month
        </Text>
        {["On time", "Late", "Absent", "Points"].map((h) => (
          <Text
            key={h}
            style={{
              flex: 1,
              textAlign: "right",
              color: colors.muted,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {h}
          </Text>
        ))}
      </View>
      {months.map((m) => (
        <View key={m.month} style={{ gap: 12 }}>
          <Divider />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                flex: 1.2,
                fontWeight: "600",
                color: colors.text,
                fontSize: 14,
              }}
            >
              {monthLabel(m.month)}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: "right",
                color: colors.success,
                fontWeight: "600",
              }}
            >
              {m.present}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: "right",
                color: colors.warning,
                fontWeight: "600",
              }}
            >
              {m.late}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: "right",
                color: colors.danger,
                fontWeight: "600",
              }}
            >
              {m.absent}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: "right",
                color: colors.text,
                fontWeight: "600",
              }}
            >
              {m.points}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <PageHeader
        title="My insights"
        subtitle={data ? `Last ${data.range_months} months` : undefined}
      />
      <ErrorText>{error}</ErrorText>

      {t ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -6 }}>
            {(
              [
                [
                  "Attendance",
                  t.attendance_rate === null ? "-" : `${t.attendance_rate}%`,
                  "calendar-outline",
                  "good",
                ],
                [
                  "On time",
                  t.on_time_rate === null ? "-" : `${t.on_time_rate}%`,
                  "time-outline",
                  "good",
                ],
                [
                  "Overtime",
                  hm(t.overtime_minutes),
                  "hourglass-outline",
                  "neutral",
                ],
                ["Points", t.points, "star-outline", "neutral"],
              ] as [string, string | number, IconName, Tone][]
            ).map(([label, value, icon, tone]) => (
              <View key={label} style={{ width: `${100 / cols}%`, padding: 6 }}>
                <StatTile label={label} value={value} icon={icon} tone={tone} />
              </View>
            ))}
          </View>

          {wide ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>{attendanceChart}</View>
                <View style={{ flex: 1 }}>{punctualityChart}</View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, gap: 16 }}>
                  {overtimeChart}
                  {monthlyCard}
                </View>
                <View style={{ flex: 1 }}>{summaryCard}</View>
              </View>
            </>
          ) : (
            <>
              {attendanceChart}
              {punctualityChart}
              {overtimeChart}
              {monthlyCard}
              {summaryCard}
            </>
          )}
        </>
      ) : (
        <Muted>No insights yet.</Muted>
      )}
    </Screen>
  );
}
