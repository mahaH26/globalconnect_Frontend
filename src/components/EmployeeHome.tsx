import {
  Button,
  Card,
  CardTitle,
  ErrorText,
  Muted,
  Notice,
  Screen,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface Attendance {
  check_in: string | null;
  check_out: string | null;
  status: string;
  overtime_minutes: number;
  early_checkout: boolean;
}
interface Summary {
  month: string;
  present: number;
  late: number;
  absent: number;
  attendance_rate: number | null;
  total_points: number;
  overtime_minutes: number;
}

const TONES = {
  neutral: { fg: "#5B6385", bg: "#EEF0F7" },
  good: { fg: "#16A34A", bg: "#E6F6EC" },
  warn: { fg: "#D97706", bg: "#FDF1D8" },
  bad: { fg: "#E11D48", bg: "#FDE7EC" },
} as const;
type Tone = keyof typeof TONES;

const time = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bahrain",
      })
    : "--:--";

// Bahrain is UTC+3 all year
const greeting = () => {
  const h = new Date(Date.now() + 3 * 3600 * 1000).getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

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
            fontSize: 28,
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

export default function EmployeeHome() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const cols = width >= 1000 ? 5 : width >= 700 ? 3 : 2;

  const [today, setToday] = useState<Attendance | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [t, s] = await Promise.all([
        api<Attendance | null>("/attendance/today"),
        api<Summary>("/attendance/me/summary"),
      ]);
      setToday(t);
      setSummary(s);
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

  async function punch(kind: "check-in" | "check-out") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted")
        throw new Error("Location permission is required to check in.");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await api(`/attendance/${kind}`, {
        method: "POST",
        body: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
      });
      setMessage(
        kind === "check-in"
          ? "Checked in successfully."
          : "Checked out successfully.",
      );
      await load();
    } catch (e: any) {
      if (e instanceof ApiError && e.data?.distance_m !== undefined) {
        setError(`${e.message} (you are ${e.data.distance_m} m away).`);
      } else {
        setError(e.message ?? "Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  }

  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bahrain",
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
        <Text style={{ color: "#5B6385", fontSize: 12 }}>{dateLabel}</Text>
      </View>
      <Text
        style={{
          color: colors.text,
          fontSize: width < 700 ? 26 : 32,
          fontWeight: "700",
        }}
      >
        {greeting()}, {firstName}
        <Text style={{ color: colors.primary }}>.</Text>
      </Text>
      <Text style={{ color: colors.muted, fontSize: 14 }}>
        Here's your day and how your month is going.
      </Text>
    </View>
  );

  const statusText = !checkedIn
    ? "Not checked in"
    : checkedOut
      ? "Day complete"
      : "Checked in";
  const statusIcon: IconName = !checkedIn
    ? "time-outline"
    : checkedOut
      ? "checkmark-done-outline"
      : "log-in-outline";

  const hero = (
    <View
      style={{
        backgroundColor: colors.navy,
        borderRadius: 16,
        padding: 22,
        gap: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#C9CDE8", fontSize: 13 }}>Today</Text>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={statusIcon} size={20} color="#fff" />
        </View>
      </View>

      <Text style={{ color: "#fff", fontSize: 30, fontWeight: "700" }}>
        {statusText}
      </Text>

      {checkedIn ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 18,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="log-in-outline" size={16} color="#C9CDE8" />
            <Text style={{ color: "#C9CDE8", fontSize: 14 }}>
              In {time(today!.check_in)}
            </Text>
            {today!.status === "late" ? (
              <View
                style={{
                  backgroundColor: "rgba(217,130,0,0.25)",
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{ color: "#F7C469", fontSize: 11, fontWeight: "600" }}
                >
                  Late
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="log-out-outline" size={16} color="#C9CDE8" />
            <Text style={{ color: "#C9CDE8", fontSize: 14 }}>
              Out {time(today!.check_out)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={{ color: "#9AA0C9", fontSize: 13 }}>
          Check in when you arrive at the office.
        </Text>
      )}

      {!checkedOut ? (
        <Button
          title={checkedIn ? "Check out" : "Check in"}
          icon={checkedIn ? "log-out-outline" : "log-in-outline"}
          onPress={() => punch(checkedIn ? "check-out" : "check-in")}
          loading={busy}
          style={wide ? { alignSelf: "flex-start", minWidth: 180 } : undefined}
        />
      ) : null}
    </View>
  );

  const rate = summary?.attendance_rate ?? null;
  const monthCard = summary ? (
    <Card style={{ gap: 14 }}>
      <CardTitle title="This month" subtitle={summary.month} />
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 36, fontWeight: "700" }}>
          {rate === null ? "-" : rate}
          {rate === null ? null : <Text style={{ fontSize: 20 }}>%</Text>}
        </Text>
        <Muted>attendance rate</Muted>
      </View>
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.navySoft,
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
      <Muted>
        {summary.present} present · {summary.late} late · {summary.absent}{" "}
        absent
      </Muted>
    </Card>
  ) : null;

  const tiles = summary ? (
    <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -6 }}>
      {(
        [
          ["Present", summary.present, "checkmark", "good"],
          ["Late", summary.late, "time-outline", "warn"],
          ["Absent", summary.absent, "close", "bad"],
          ["Points", summary.total_points, "star-outline", "neutral"],
          [
            "Overtime (min)",
            summary.overtime_minutes,
            "hourglass-outline",
            "neutral",
          ],
        ] as [string, number, IconName, Tone][]
      ).map(([label, value, icon, tone]) => (
        <View key={label} style={{ width: `${100 / cols}%`, padding: 6 }}>
          <StatTile label={label} value={value} icon={icon} tone={tone} />
        </View>
      ))}
    </View>
  ) : null;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <View style={{ gap: 20 }}>
        {pageHeader}
        <ErrorText>{error}</ErrorText>
        <Notice tone="good">{message}</Notice>

        {wide ? (
          <View
            style={{ flexDirection: "row", gap: 16, alignItems: "stretch" }}
          >
            <View style={{ flex: 2 }}>{hero}</View>
            <View style={{ flex: 1 }}>{monthCard}</View>
          </View>
        ) : (
          <>
            {hero}
            {monthCard}
          </>
        )}

        {tiles}
      </View>
    </Screen>
  );
}
