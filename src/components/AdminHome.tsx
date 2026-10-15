import { ErrorText, Screen } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

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

const INK = colors.navy;
const SOFT = "#5B6385";
const PINK = "#FDE9F0";
const TONES = {
  neutral: { fg: SOFT, bg: "#EEF0F7" },
  good: { fg: "#16A34A", bg: "#E6F6EC" },
  warn: { fg: "#D97706", bg: "#FDF1D8" },
  bad: { fg: "#E11D48", bg: "#FDE7EC" },
} as const;
type Tone = keyof typeof TONES;

function Card({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <View
      style={[
        {
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CardTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: INK, fontWeight: "700", fontSize: 15 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function IconCircle({
  name,
  tone = "neutral",
  size = 32,
}: {
  name: IconName;
  tone?: Tone;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: TONES[tone].bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={TONES[tone].fg} />
    </View>
  );
}

function CountPill({ count }: { count: number }) {
  const tone: Tone = count > 0 ? "warn" : "good";
  return (
    <View
      style={{
        minWidth: 26,
        height: 24,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: TONES[tone].bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: TONES[tone].fg, fontWeight: "700", fontSize: 12 }}>
        {count}
      </Text>
    </View>
  );
}

function AlertRow({
  title,
  hint,
  count,
  last,
  onPress,
}: {
  title: string;
  hint: string;
  count: number;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: INK, fontWeight: "600", fontSize: 14 }}>
          {title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
          {hint}
        </Text>
      </View>
      <CountPill count={count} />
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: IconName;
  tone?: Tone;
}) {
  return (
    <Card style={{ padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: tone === "neutral" ? INK : TONES[tone].fg,
            fontSize: 28,
            fontWeight: "700",
          }}
        >
          {value}
        </Text>
        <IconCircle name={icon} tone={tone} />
      </View>
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>
        {label}
      </Text>
    </Card>
  );
}

/** Bar chart with light gridlines, built from Views (no extra package) */
function BarChart({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const H = 150;
  const max = Math.max(1, ...items.map((i) => i.value));
  const top = Math.max(3, Math.ceil(max / 3) * 3);
  const ticks = [0, 1, 2, 3].map((i) => (top / 3) * i);

  return (
    <View>
      <View style={{ flexDirection: "row", height: H }}>
        <View style={{ width: 26, height: H }}>
          {ticks.map((t, i) => (
            <Text
              key={t}
              style={{
                position: "absolute",
                right: 8,
                bottom: (i / 3) * H - 7,
                fontSize: 10,
                color: colors.muted,
              }}
            >
              {t}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, height: H }}>
          {ticks.map((t, i) => (
            <View
              key={t}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: (i / 3) * H,
                height: 1,
                backgroundColor: i === 0 ? colors.border : "#F0F1F7",
              }}
            />
          ))}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-around",
            }}
          >
            {items.map((i) => (
              <View
                key={i.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: INK,
                    marginBottom: 4,
                  }}
                >
                  {i.value}
                </Text>
                <View
                  style={{
                    width: "60%",
                    maxWidth: 40,
                    height: Math.max(4, (i.value / top) * (H - 20)),
                    backgroundColor: i.color,
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <View style={{ width: 26 }} />
        <View style={{ flex: 1, flexDirection: "row" }}>
          {items.map((i) => (
            <Text
              key={i.label}
              numberOfLines={2}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 11,
                color: colors.muted,
              }}
            >
              {i.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function AdminHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const twoColumns = width >= 1180; // desktop with the full sidebar
  const cols = width >= 1180 ? 6 : width >= 700 ? 3 : 2;

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

  // Adjust these field names to match your user object
  const firstName: string =
    ((user as any)?.full_name ?? (user as any)?.name ?? "").split(" ")[0] ||
    "there";
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const pageHeader = (
    <View style={{ gap: 6, marginBottom: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.primary,
          }}
        />
        <Text style={{ color: SOFT, fontSize: 12 }}>{today}</Text>
      </View>
      <Text
        style={{
          color: INK,
          fontSize: width < 700 ? 26 : 32,
          fontWeight: "700",
        }}
      >
        {greeting()}, {firstName}
        <Text style={{ color: colors.primary }}>.</Text>
      </Text>
      <Text style={{ color: colors.muted, fontSize: 14 }}>
        Here's how your team is doing today.
      </Text>
    </View>
  );

  const rate = data?.attendance_rate ?? null;
  const hero = (
    <View
      style={{
        backgroundColor: colors.navy,
        borderRadius: 16,
        padding: 22,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
          Team attendance
        </Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: "#C9CDE8", fontSize: 11 }}>
            Today{data && !data.is_workday ? " · weekend" : ""}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <View>
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
          >
            <Text style={{ color: "#fff", fontSize: 44, fontWeight: "700" }}>
              {rate == null ? "-" : rate}
              {rate == null ? null : <Text style={{ fontSize: 24 }}>%</Text>}
            </Text>
            <Text style={{ color: "#9AA0C9", fontSize: 12 }}>
              attendance rate
            </Text>
          </View>
          <Text style={{ color: "#C9CDE8", fontSize: 13, marginTop: 4 }}>
            {data
              ? `${data.present} present  ·  ${data.late} late  ·  ${data.absent} absent`
              : ""}
          </Text>
        </View>

        <Pressable
          onPress={() => go("/team-attendance")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 11,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
            View attendance
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </Pressable>
      </View>

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
  );

  const attention = data ? (
    <Card>
      <CardTitle
        title="Needs your attention"
        right={<IconCircle name="time-outline" tone="warn" />}
      />
      <AlertRow
        title="Leave requests"
        hint="Waiting for your review"
        count={data.alerts.pending_leave_requests}
        onPress={() => go("/leave-review")}
      />
      <AlertRow
        title="Missing check-outs"
        hint="Checked in but not out, counted after work hours"
        count={data.alerts.missing_checkout}
        last
        onPress={() => go("/team-attendance")}
      />
    </Card>
  ) : null;

  const overview = data ? (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: INK, fontWeight: "700", fontSize: 16 }}>
          Today's overview
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {data.total_employees} team members
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -6 }}>
        {(
          [
            ["Employees", data.total_employees, "people-outline", "neutral"],
            ["Present", data.present, "checkmark", "good"],
            ["Late", data.late, "time-outline", "warn"],
            ["On leave", data.on_leave, "calendar-outline", "neutral"],
            [
              "Not checked in",
              data.not_checked_in,
              "log-in-outline",
              "neutral",
            ],
            ["Absent", data.absent, "close", "bad"],
          ] as [string, number, IconName, Tone][]
        ).map(([label, value, ic, tone]) => (
          <View key={label} style={{ width: `${100 / cols}%`, padding: 6 }}>
            <StatTile label={label} value={value} icon={ic} tone={tone} />
          </View>
        ))}
      </View>
    </View>
  ) : null;

  const chart = data ? (
    <Card>
      <CardTitle
        title="Attendance breakdown"
        subtitle="A snapshot of your team today"
      />
      <BarChart
        items={[
          { label: "Present", value: data.present, color: colors.success },
          { label: "Late", value: data.late, color: colors.warning },
          { label: "On leave", value: data.on_leave, color: colors.navy },
          { label: "Not in", value: data.not_checked_in, color: "#B4B8CE" },
          { label: "Absent", value: data.absent, color: colors.danger },
        ]}
      />
      {data.not_checked_in > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
            }}
          />
          <Text style={{ color: SOFT, fontSize: 12 }}>
            {data.not_checked_in} employees haven't checked in yet
          </Text>
        </View>
      ) : null}
    </Card>
  ) : null;

  const unread = data?.alerts.unread_notifications ?? [];
  const activity = data ? (
    <Card>
      <CardTitle
        title="Recent activity"
        right={
          unread.length > 0 ? (
            <View
              style={{
                backgroundColor: PINK,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {unread.length} new
              </Text>
            </View>
          ) : null
        }
      />
      {unread.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          You're all caught up.
        </Text>
      ) : (
        <View style={{ gap: 16 }}>
          {unread.map((n) => (
            <View key={n.id} style={{ flexDirection: "row", gap: 12 }}>
              <IconCircle name="notifications-outline" size={32} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: INK, fontWeight: "600", fontSize: 13 }}>
                  {n.title}
                </Text>
                {n.message || n.body ? (
                  <Text
                    style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}
                  >
                    {n.message ?? n.body}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
      <Pressable
        onPress={() => go("/notifications")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 18,
        }}
      >
        <Text
          style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}
        >
          View all notifications
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </Pressable>
    </Card>
  ) : null;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <ErrorText>{error}</ErrorText>

      <View style={{ gap: 20 }}>
        {pageHeader}

        {twoColumns ? (
          <>
            <View
              style={{ flexDirection: "row", gap: 16, alignItems: "stretch" }}
            >
              <View style={{ flex: 2 }}>{hero}</View>
              <View style={{ flex: 1 }}>{attention}</View>
            </View>
            {overview}
            <View
              style={{
                flexDirection: "row",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 2 }}>{chart}</View>
              <View style={{ flex: 1 }}>{activity}</View>
            </View>
          </>
        ) : (
          <>
            {hero}
            {attention}
            {overview}
            {chart}
            {activity}
          </>
        )}
      </View>
    </Screen>
  );
}
