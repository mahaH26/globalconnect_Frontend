import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Muted,
  Screen,
  Section,
  Stat,
  StatGrid,
} from "@/components/ui";
import { colors, radius } from "@/theme";

interface Dashboard {
  date: string;
  is_workday: boolean;
  total_employees: number;
  present: number;
  on_time: number;
  late: number;
  on_leave: number;
  not_checked_in: number;
  absent: number;
  attendance_rate: number | null;
  alerts: {
    pending_leave_requests: number;
    missing_checkout: number;
    unread_notifications: {
      id: string;
      title: string;
      message?: string | null;
      body?: string | null;
    }[];
  };
}

/** Simple bar chart built from Views, so it needs no extra package and works on web and phone */
function BarChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const H = 130;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 8,
        height: H + 62,
        marginTop: 8,
      }}
    >
      {items.map((i) => (
        <View
          key={i.label}
          style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6 }}
        >
          <Text style={{ fontWeight: "800", color: colors.text }}>{i.value}</Text>
          <View
            style={{
              width: "70%",
              maxWidth: 52,
              height: Math.max(4, (i.value / max) * H),
              backgroundColor: i.color,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
          <Text
            style={{ fontSize: 11, color: colors.muted, textAlign: "center", height: 28 }}
            numberOfLines={2}
          >
            {i.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AlertRow({
  title,
  hint,
  count,
  onPress,
}: {
  title: string;
  hint: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.text, fontWeight: "700" }}>{title}</Text>
        <Muted>{hint}</Muted>
      </View>
      <Badge text={String(count)} tone={count > 0 ? "warn" : "good"} />
    </Pressable>
  );
}

export default function AdminHome() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api<Dashboard>("/dashboard"));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const go = (path: string) => router.push(path as any);

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <ErrorText>{error}</ErrorText>

      {/* Hero card */}
      <View
        style={{
          backgroundColor: colors.navy,
          borderRadius: radius.lg,
          padding: 18,
          gap: 12,
        }}
      >
        <Text style={{ color: "#C9CDE8", fontSize: 13 }}>
          Today · {data?.date ?? "..."}
          {data && !data.is_workday ? " (weekend)" : ""}
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View>
            <Text style={{ color: "#fff", fontSize: 36, fontWeight: "800" }}>
              {data?.attendance_rate == null ? "-" : `${data.attendance_rate}%`}
            </Text>
            <Text style={{ color: "#C9CDE8", fontSize: 14 }}>
              {data ? `${data.present} present · ${data.late} late · ${data.absent} absent` : ""}
            </Text>
          </View>
          <Button small title="View attendance" onPress={() => go("/team-attendance")} />
        </View>
      </View>

      {data ? (
        <>
          <Section title="Today's overview" />
          <StatGrid>
            <Stat label="Employees" value={data.total_employees} />
            <Stat label="Present" value={data.present} tone="good" />
            <Stat label="Late" value={data.late} tone="warn" />
            <Stat label="On leave" value={data.on_leave} />
            <Stat label="Not checked in" value={data.not_checked_in} />
            <Stat label="Absent" value={data.absent} tone="bad" />
          </StatGrid>

          <Card>
            <Text style={{ fontWeight: "700", color: colors.text }}>Attendance breakdown</Text>
            <BarChart
              items={[
                { label: "Present", value: data.present, color: colors.success },
                { label: "Late", value: data.late, color: colors.warning },
                { label: "On leave", value: data.on_leave, color: colors.navy },
                { label: "Not checked in", value: data.not_checked_in, color: "#9AA0C0" },
                { label: "Absent", value: data.absent, color: colors.danger },
              ]}
            />
          </Card>

          <Section title="Needs your attention" />
          <Card>
            <AlertRow
              title="Leave requests to review"
              hint="Employees waiting for you to approve or reject their leave"
              count={data.alerts.pending_leave_requests}
              onPress={() => go("/leave-review")}
            />
            <AlertRow
              title="Missing check-outs"
              hint="Checked in today but did not check out, counted after work hours end"
              count={data.alerts.missing_checkout}
              onPress={() => go("/team-attendance")}
            />
            {data.alerts.unread_notifications.length > 0 ? (
              <View style={{ gap: 6, marginTop: 8 }}>
                <Muted>Your unread notifications</Muted>
                {data.alerts.unread_notifications.map((n) => (
                  <Text key={n.id} style={{ color: colors.text }}>
                    • <Text style={{ fontWeight: "700" }}>{n.title}</Text>
                    {n.message || n.body ? `: ${n.message ?? n.body}` : ""}
                  </Text>
                ))}
                <Button
                  small
                  variant="ghost"
                  title="Open notifications"
                  onPress={() => go("/notifications")}
                />
              </View>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}