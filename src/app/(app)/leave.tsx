import { Center } from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type LeaveType = "annual" | "sick" | "emergency" | "unpaid";
const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "emergency", "unpaid"];

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

export default function LeaveScreen() {
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
      setFormError("Enter start and end dates (YYYY-MM-DD)");
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

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      <Text>Leave</Text>
      {loadError && <Text>{loadError}</Text>}

      <Text>Balance ({new Date().getFullYear()})</Text>
      {balance.map((b) => (
        <View key={b.leave_type}>
          <Text>{b.leave_type}</Text>
          <Text>
            Allowance: {b.allowance ?? "Unlimited"} | Approved: {b.approved} |
            Pending: {b.pending} | Remaining: {b.remaining ?? "Unlimited"}
          </Text>
        </View>
      ))}

      <Text>Request leave</Text>
      <View>
        {LEAVE_TYPES.map((t) => (
          <TouchableOpacity key={t} onPress={() => setLeaveType(t)}>
            <Text>
              {leaveType === t ? "● " : "○ "}
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        placeholder="Start date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="End date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Reason (optional)"
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={500}
      />

      {conflicts.length > 0 && (
        <View>
          <Text style={{ color: colors.warning, fontWeight: "700" }}>
            Heads up: teammates already off in this period
          </Text>
          {conflicts.map((c) => (
            <Text key={c.id} style={{ color: colors.warning }}>
              {c.full_name}: {c.start_date} to {c.end_date} ({c.status})
            </Text>
          ))}
        </View>
      )}

      {formError && <Text>{formError}</Text>}
      {success && <Text>{success}</Text>}
      <TouchableOpacity onPress={submit} disabled={submitting}>
        <Text>{submitting ? "Submitting..." : "Submit request"}</Text>
      </TouchableOpacity>

      <Text>My requests</Text>
      {requests.length === 0 && <Text>No leave requests yet.</Text>}
      {requests.map((r) => (
        <View key={String(r.id)}>
          <Text>
            {r.leave_type} - {r.status}
          </Text>
          <Text>
            {r.start_date} to {r.end_date} ({r.days} day
            {r.days === 1 ? "" : "s"})
          </Text>
          {r.reason ? <Text>{r.reason}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}