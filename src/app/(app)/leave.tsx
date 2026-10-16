import DateField from "@/components/DateField";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Center,
  Chips,
  Divider,
  Empty,
  ErrorText,
  Field,
  FieldRow,
  Muted,
  Notice,
  PageHeader,
  Row,
  Screen,
  toneFor,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];
type LeaveType = "annual" | "sick" | "emergency" | "unpaid";
const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "emergency", "unpaid"];

const TYPE_ICON: Record<string, IconName> = {
  annual: "sunny-outline",
  sick: "medkit-outline",
  emergency: "alert-circle-outline",
  unpaid: "wallet-outline",
};

interface Balance {
  leave_type: string;
  allowance: number | null;
  approved: number;
  pending: number;
  remaining: number | null;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
}

interface Conflict {
  id: string;
  full_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function IconDot({ name, size = 30 }: { name: IconName; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accentSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size * 0.52} color={colors.primary} />
    </View>
  );
}

function BalanceTile({ b }: { b: Balance }) {
  const unlimited = b.allowance == null;
  const used = b.approved + b.pending;
  const approvedPct = unlimited
    ? 0
    : Math.min(100, (b.approved / b.allowance!) * 100);
  const pendingPct = unlimited
    ? 0
    : Math.min(100 - approvedPct, (b.pending / b.allowance!) * 100);

  return (
    <Card style={{ padding: 16, gap: 10 }}>
      <Row style={{ gap: 8 }}>
        <IconDot name={TYPE_ICON[b.leave_type] ?? "calendar-outline"} />
        <Text
          style={{
            color: colors.muted,
            fontSize: 13,
            fontWeight: "500",
            textTransform: "capitalize",
          }}
        >
          {b.leave_type}
        </Text>
      </Row>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
          {unlimited ? "∞" : b.remaining}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {unlimited ? "unlimited" : `of ${b.allowance} days left`}
        </Text>
      </View>

      {unlimited ? null : (
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.navySoft,
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${approvedPct}%`,
              backgroundColor: colors.primary,
            }}
          />
          <View
            style={{ width: `${pendingPct}%`, backgroundColor: "#F2B84B" }}
          />
        </View>
      )}

      <Text style={{ color: colors.muted, fontSize: 12 }}>
        {b.approved} approved · {b.pending} pending
        {unlimited ? "" : ` · ${used} used`}
      </Text>
    </Card>
  );
}

export default function LeaveScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const cols = width >= 900 ? 4 : 2;

  const [balance, setBalance] = useState<Balance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const [bal, reqs] = await Promise.all([
        api<Balance[]>("/leave/balance"),
        api<LeaveRequest[]>("/leave/me"),
      ]);
      setBalance(bal);
      setRequests(reqs);
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load leave data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Check teammates' leave whenever both dates are valid
  useEffect(() => {
    const s = startDate.trim();
    const e = endDate.trim();
    if (!DATE_RE.test(s) || !DATE_RE.test(e) || e < s) {
      setConflicts([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await api<{ conflicts: Conflict[] }>(
          `/leave/conflicts?start_date=${s}&end_date=${e}`,
        );
        setConflicts(r.conflicts);
      } catch {
        setConflicts([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [startDate, endDate]);

  const submit = async () => {
    setFormError(null);
    setSuccess(null);
    if (!startDate || !endDate) {
      setFormError("Choose a start and end date");
      return;
    }
    if (endDate < startDate) {
      setFormError("The end date can't be before the start date");
      return;
    }
    setSubmitting(true);
    try {
      await api("/leave", {
        method: "POST",
        body: {
          leave_type: leaveType,
          start_date: startDate.trim(),
          end_date: endDate.trim(),
          reason: reason.trim() || undefined,
        },
      });
      setSuccess("Leave request submitted");
      setStartDate("");
      setEndDate("");
      setReason("");
      setConflicts([]);
      await load();
    } catch (e: any) {
      setFormError(e?.message ?? "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Center>
        <ActivityIndicator size="large" color={colors.primary} />
      </Center>
    );
  }

  const balances = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -6 }}>
      {balance.map((b) => (
        <View
          key={b.leave_type}
          style={{ width: `${100 / cols}%`, padding: 6 }}
        >
          <BalanceTile b={b} />
        </View>
      ))}
    </View>
  );

  const form = (
    <Card style={{ gap: 16 }}>
      <CardTitle
        title="Request leave"
        subtitle="Your manager will be notified"
      />
      <Chips
        label="Leave type"
        options={LEAVE_TYPES.map((t) => ({ value: t, label: t }))}
        value={leaveType}
        onChange={setLeaveType}
      />
      <FieldRow>
        <DateField
          half
          label="Start date"
          value={startDate}
          onChange={setStartDate}
        />
        <DateField
          half
          label="End date"
          value={endDate}
          onChange={setEndDate}
          minDate={startDate || undefined}
        />
      </FieldRow>
      <Field
        label="Reason (optional)"
        placeholder="Anything your manager should know"
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={500}
      />

      {conflicts.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.warningSoft,
            borderRadius: 10,
            padding: 14,
            gap: 6,
          }}
        >
          <Row style={{ gap: 8 }}>
            <Ionicons name="people-outline" size={16} color={colors.warning} />
            <Text
              style={{
                color: colors.warning,
                fontWeight: "600",
                fontSize: 13,
                flex: 1,
              }}
            >
              Heads up: teammates already off in this period
            </Text>
          </Row>
          {conflicts.map((c) => (
            <Text key={c.id} style={{ color: colors.warning, fontSize: 13 }}>
              {c.full_name}: {c.start_date} to {c.end_date} ({c.status})
            </Text>
          ))}
        </View>
      ) : null}

      <ErrorText>{formError}</ErrorText>
      <Notice tone="good">{success}</Notice>
      <Button
        title="Submit request"
        icon="paper-plane-outline"
        onPress={submit}
        loading={submitting}
      />
    </Card>
  );

  const myRequests = (
    <Card style={{ gap: 14 }}>
      <CardTitle title="My requests" subtitle={`${requests.length} in total`} />
      {requests.length === 0 ? <Empty text="No leave requests yet." /> : null}
      {requests.map((r, i) => (
        <View key={String(r.id)} style={{ gap: 14 }}>
          {i > 0 ? <Divider /> : null}
          <Row style={{ alignItems: "flex-start", gap: 12 }}>
            <IconDot
              name={TYPE_ICON[r.leave_type] ?? "calendar-outline"}
              size={34}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Row style={{ justifyContent: "space-between", gap: 8 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "600",
                    fontSize: 14,
                    textTransform: "capitalize",
                    flexShrink: 1,
                  }}
                >
                  {r.leave_type}
                </Text>
                <Badge text={r.status} tone={toneFor(r.status)} />
              </Row>
              <Muted>
                {r.start_date} to {r.end_date} · {r.days} day
                {r.days === 1 ? "" : "s"}
              </Muted>
              {r.reason ? (
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  {r.reason}
                </Text>
              ) : null}
            </View>
          </Row>
        </View>
      ))}
    </Card>
  );

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <PageHeader
        title="Leave"
        subtitle={`Your balance for ${new Date().getFullYear()} and your requests`}
      />
      <ErrorText>{loadError}</ErrorText>
      {balances}
      {wide ? (
        <View
          style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1 }}>{form}</View>
          <View style={{ flex: 1 }}>{myRequests}</View>
        </View>
      ) : (
        <>
          {form}
          {myRequests}
        </>
      )}
    </Screen>
  );
}
