import UserAvatar from "@/components/UserAvatar";
import {
  Card,
  Empty,
  ErrorText,
  Muted,
  Row,
  Title,
  listContent,
  listStyle,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

interface Conv {
  id: string;
  type: "direct" | "group";
  name: string;
  member_count: number;
  last_message: string | null;
  last_at: string | null;
  unread: number;
  avatar_url?: string | null;
}

type Filter = "all" | "direct" | "group";
const SOFT = "#5B6385";

export default function ChatList() {
  const router = useRouter();
  const [rows, setRows] = useState<Conv[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await api<Conv[]>("/chat/conversations"));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load chats");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 5000);
      return () => clearInterval(t);
    }, [load]),
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      direct: rows.filter((r) => r.type === "direct").length,
      group: rows.filter((r) => r.type === "group").length,
    }),
    [rows],
  );

  const data = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.type === filter)),
    [rows, filter],
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "direct", label: "Direct" },
    { key: "group", label: "Groups" },
  ];

  const emptyText =
    filter === "group"
      ? "No groups yet."
      : filter === "direct"
        ? "No direct chats yet."
        : "No conversations yet.";

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={[
        listContent,
        { width: "100%", maxWidth: 720, alignSelf: "center" },
      ]}
      data={data}
      keyExtractor={(r) => r.id}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ gap: 14, marginBottom: 14 }}>
          <Title>Chat</Title>

          {/* Small "new chat" button, left aligned */}
          <Pressable
            onPress={() => router.push("/chat-new" as any)}
            style={(s: any) => ({
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: colors.primary,
              opacity: s.hovered ? 0.9 : 1,
            })}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
              New chat
            </Text>
          </Pressable>

          {/* Filter tabs */}
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            {tabs.map((t) => {
              const on = filter === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setFilter(t.key)}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 2,
                    borderBottomColor: on ? colors.primary : "transparent",
                    marginBottom: -1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: on ? "700" : "500",
                      color: on ? colors.primary : SOFT,
                    }}
                  >
                    {t.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: on ? colors.primary : colors.muted,
                    }}
                  >
                    {counts[t.key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <ErrorText>{error}</ErrorText> : null}
        </View>
      }
      ListEmptyComponent={<Empty text={emptyText} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/chat-room",
              params: { id: item.id },
            } as any)
          }
        >
          <Card style={{ marginBottom: 10 }}>
            <Row>
              <UserAvatar
                name={item.name}
                uri={item.avatar_url ?? null}
                size={40}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  {item.type === "group" ? (
                    <Ionicons name="people-outline" size={15} color={SOFT} />
                  ) : null}
                  <Text
                    numberOfLines={1}
                    style={{
                      fontWeight: "700",
                      color: colors.text,
                      flexShrink: 1,
                    }}
                  >
                    {item.name}
                  </Text>
                </View>
                <Muted>{item.last_message ?? "No messages yet"}</Muted>
              </View>
              {item.unread > 0 ? (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                    minWidth: 22,
                    height: 22,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 6,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}
                  >
                    {item.unread}
                  </Text>
                </View>
              ) : null}
            </Row>
          </Card>
        </Pressable>
      )}
    />
  );
}
