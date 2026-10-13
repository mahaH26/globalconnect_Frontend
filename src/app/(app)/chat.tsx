import { api } from "@/lib/api";
import {
  Avatar,
  Button,
  Card,
  Empty,
  ErrorText,
  Muted,
  Row,
  Title,
  listContent,
  listStyle,
} from "@/components/ui";
import { colors } from "@/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

interface Conv {
  id: string;
  type: "direct" | "group";
  name: string;
  member_count: number;
  last_message: string | null;
  last_at: string | null;
  unread: number;
}

export default function ChatList() {
  const router = useRouter();
  const [rows, setRows] = useState<Conv[]>([]);
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

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={listContent}
      data={rows}
      keyExtractor={(r) => r.id}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 14 }}>
          <Title>Chat</Title>
          <Button title="New chat or group" onPress={() => router.push("/chat-new" as any)} />
          <ErrorText>{error}</ErrorText>
        </View>
      }
      ListEmptyComponent={<Empty text="No conversations yet." />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({ pathname: "/chat-room", params: { id: item.id } } as any)
          }
        >
          <Card style={{ marginBottom: 10 }}>
            <Row>
              <Avatar name={item.name} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontWeight: "700", color: colors.text }}>
                  {item.type === "group" ? `👥 ${item.name}` : item.name}
                </Text>
                <Muted>{item.last_message ?? "No messages yet"}</Muted>
              </View>
              {item.unread > 0 ? (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                    minWidth: 24,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 6,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
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