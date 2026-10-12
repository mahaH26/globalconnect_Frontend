import { api } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

interface PendingLeave {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  profiles: { full_name: string } | null;
}

export default function LeaveReviewScreen() {
  const [rows, setRows] = useState<PendingLeave[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await api<PendingLeave[]>("/leave?status=pending"));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load requests");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusyId(String(id));
    try {
      await api(`/leave/${id}/review`, { method: "PATCH", body: { status } });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Could not update request");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => String(r.id)}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View>
          <Text>Leave requests</Text>
          {error && <Text>{error}</Text>}
        </View>
      }
      ListEmptyComponent={<Text>No pending requests.</Text>}
      renderItem={({ item }) => (
        <View>
          <Text>
            {item.profiles?.full_name ?? "Employee"} - {item.leave_type}
          </Text>
          <Text>
            {item.start_date} to {item.end_date} ({item.days} day
            {item.days === 1 ? "" : "s"})
          </Text>
          {item.reason ? <Text>{item.reason}</Text> : null}
          <TouchableOpacity
            disabled={busyId === String(item.id)}
            onPress={() => review(item.id, "approved")}
          >
            <Text>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={busyId === String(item.id)}
            onPress={() => review(item.id, "rejected")}
          >
            <Text>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
