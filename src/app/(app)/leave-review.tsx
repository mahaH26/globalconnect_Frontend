import { api } from "@/lib/api";
import {
  Avatar,
  Badge,
  Card,
  Button,
  Empty,
  ErrorText,
  Muted,
  Row,
  Title,
  listContent,
  listStyle,
} from "@/components/ui";
import { colors } from "@/theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
      style={listStyle}
      contentContainerStyle={listContent}
      data={rows}
      keyExtractor={(r) => String(r.id)}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 14 }}>
          <Title>Leave requests</Title>
          <Muted>{rows.length} pending</Muted>
          <ErrorText>{error}</ErrorText>
        </View>
      }
      ListEmptyComponent={<Empty text="No pending requests." />}
      renderItem={({ item }) => {
        const busy = busyId === String(item.id);
        return (
          <Card style={{ marginBottom: 12, gap: 12 }}>
            <Row>
              <Avatar name={item.profiles?.full_name} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                  {item.profiles?.full_name ?? "Employee"}
                </Text>
                <Badge text={item.leave_type} tone="info" />
              </View>
            </Row>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {item.start_date} to {item.end_date} ({item.days} day
              {item.days === 1 ? "" : "s"})
            </Text>
            {item.reason ? <Muted>{item.reason}</Muted> : null}
            <Row>
              <Button
                style={{ flex: 1 }}
                title="Approve"
                disabled={busy}
                onPress={() => review(item.id, "approved")}
              />
              <Button
                style={{ flex: 1 }}
                variant="secondary"
                title="Reject"
                disabled={busy}
                onPress={() => review(item.id, "rejected")}
              />
            </Row>
          </Card>
        );
      }}
    />
  );
}