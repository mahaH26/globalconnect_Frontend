import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button, ErrorText, Muted, Title } from "@/components/ui";
import { colors } from "@/theme";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";

interface Msg {
  id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}
interface Room {
  conversation: { id: string; type: "direct" | "group"; name: string | null };
  members: { user_id: string; full_name: string }[];
  messages: Msg[];
}

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bahrain",
  });

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const listRef = useRef<FlatList<Msg>>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setRoom(await api<Room>(`/chat/conversations/${id}/messages`));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load messages");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 4000);
      return () => clearInterval(t);
    }, [load]),
  );

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await api(`/chat/conversations/${id}/messages`, {
        method: "POST",
        body: { body },
      });
      setText("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const isGroup = room?.conversation.type === "group";
  const title = isGroup
    ? (room?.conversation.name ?? "Group")
    : (room?.members.find((m) => m.user_id !== user?.id)?.full_name ?? "Chat");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, gap: 8 }}>
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
        <Title>{title}</Title>
        {isGroup ? (
          <Muted>{room?.members.map((m) => m.full_name).join(", ")}</Muted>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        data={room?.messages ?? []}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Muted>No messages yet. Say hello!</Muted>}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                backgroundColor: mine ? colors.primary : colors.navySoft,
                borderRadius: 14,
                paddingVertical: 8,
                paddingHorizontal: 12,
                gap: 2,
              }}
            >
              {isGroup && !mine ? (
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.navy }}>
                  {item.sender_name}
                </Text>
              ) : null}
              <Text style={{ color: mine ? "#fff" : colors.text }}>{item.body}</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: mine ? "#FFD3E1" : colors.muted,
                  alignSelf: "flex-end",
                }}
              >
                {hhmm(item.created_at)}
              </Text>
            </View>
          );
        }}
      />

      <View style={{ padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <ErrorText>{error}</ErrorText>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.field,
              borderRadius: 10,
              padding: 12,
              color: colors.text,
            }}
            placeholder="Type a message"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            maxLength={2000}
          />
          <Button title="Send" onPress={send} loading={sending} />
        </View>
      </View>
    </View>
  );
}