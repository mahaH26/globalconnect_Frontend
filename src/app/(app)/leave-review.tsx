import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Empty,
  ErrorText,
  Muted,
  PageHeader,
  Row,
  listContent,
  listStyle,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, View, useWindowDimensions } from "react-native";

interface PendingLeave {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  profiles: { full_name: string } | null;
}

interface Conflict {
  id: string;
  full_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function LeaveReviewScreen() {
  const { width } = useWindowDimensions();
  // Two cards per row on desktop, one on iPad / phone
  const cols = width >= 1000 ? 2 : 1;
  const phone = width < 700;

  const [rows, setRows] = useState<PendingLeave[]>([]);
  const [conflicts, setConflicts] = useState<Record<string, Conflict[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await api<PendingLeave[]>("/leave?status=pending");
      setRows(list);

      const entries = await Promise.all(
        list.map(async (r) => {
          try {
            const res = await api<{ conflicts: Conflict[] }>(
              `/leave/${r.id}/conflicts`,
            );
            return [String(r.id), res.conflicts] as const;
          } catch {
            return [String(r.id), [] as Conflict[]] as const;
          }
        }),
      );
      setConflicts(Object.fromEntries(entries));
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
      key={cols} // numColumns can't change on a mounted list
      style={listStyle}
      contentContainerStyle={listContent}
      data={rows}
      numColumns={cols}
      columnWrapperStyle={cols > 1 ? { marginHorizontal: -8 } : undefined}
      keyExtractor={(r) => String(r.id)}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 12 }}>
          <PageHeader
            title="Leave requests"
            subtitle={`${rows.length} pending ${rows.length === 1 ? "request" : "requests"}`}
          />
          <ErrorText>{error}</ErrorText>
        </View>
      }
      ListEmptyComponent={<Empty text="No pending requests." />}
      renderItem={({ item }) => {
        const busy = busyId === String(item.id);
        const overlap = conflicts[String(item.id)] ?? [];
        return (
          <View
            style={{
              flex: 1,
              maxWidth: `${100 / cols}%`,
              paddingHorizontal: cols > 1 ? 8 : 0,
              paddingVertical: 6,
            }}
          >
            <Card style={{ gap: 14 }}>
              <Row style={{ gap: 12 }}>
                <Avatar name={item.profiles?.full_name} size={40} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {item.profiles?.full_name ?? "Employee"}
                  </Text>
                  <Badge text={item.leave_type} tone="info" />
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    {item.days}
                  </Text>
                  <Muted>{item.days === 1 ? "day" : "days"}</Muted>
                </View>
              </Row>

              <Row style={{ gap: 8 }}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.muted}
                />
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "500",
                    fontSize: 13,
                  }}
                >
                  {item.start_date} to {item.end_date}
                </Text>
              </Row>

              {item.reason ? (
                <Row style={{ alignItems: "flex-start", gap: 8 }}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={colors.muted}
                  />
                  <Text style={{ flex: 1, color: colors.muted, fontSize: 13 }}>
                    {item.reason}
                  </Text>
                </Row>
              ) : null}

              {overlap.length > 0 ? (
                <View
                  style={{
                    backgroundColor: colors.warningSoft,
                    borderRadius: 10,
                    padding: 12,
                    gap: 4,
                  }}
                >
                  <Row style={{ gap: 8 }}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={colors.warning}
                    />
                    <Text
                      style={{
                        flex: 1,
                        color: colors.warning,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {overlap.length} teammate{overlap.length === 1 ? "" : "s"}{" "}
                      off in this period
                    </Text>
                  </Row>
                  {overlap.map((c) => (
                    <Text
                      key={c.id}
                      style={{ color: colors.warning, fontSize: 12 }}
                    >
                      {c.full_name}: {c.start_date} to {c.end_date} ({c.status})
                    </Text>
                  ))}
                </View>
              ) : null}

              <Divider />

              {/* Compact buttons: side by side on phones, natural width on larger screens */}
              <Row style={{ gap: 8 }}>
                <Button
                  small
                  icon="checkmark"
                  title="Approve"
                  disabled={busy}
                  style={phone ? { flex: 1, alignSelf: "stretch" } : undefined}
                  onPress={() => review(item.id, "approved")}
                />
                <Button
                  small
                  variant="secondary"
                  icon="close"
                  title="Reject"
                  disabled={busy}
                  style={phone ? { flex: 1, alignSelf: "stretch" } : undefined}
                  onPress={() => review(item.id, "rejected")}
                />
              </Row>
            </Card>
          </View>
        );
      }}
    />
  );
}
