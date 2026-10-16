import { Button, ErrorText, Muted, Title } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

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

const SOFT = "#5B6385";
const MAX_WIDTH = 720;

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
      {/* Header */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={(s: any) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: s.hovered ? "#F4F5FA" : "transparent",
            })}
          >
            <Ionicons name="chevron-back" size={20} color={SOFT} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>{title}</Title>
            {isGroup ? (
              <Muted>{room?.members.map((m) => m.full_name).join(", ")}</Muted>
            ) : null}
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          gap: 8,
          width: "100%",
          maxWidth: MAX_WIDTH,
          alignSelf: "center",
        }}
        data={room?.messages ?? []}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={<Muted>No messages yet. Say hello!</Muted>}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                backgroundColor: mine ? colors.primary : "#FFFFFF",
                borderWidth: mine ? 0 : 1,
                borderColor: colors.border,
                borderRadius: 14,
                borderBottomRightRadius: mine ? 4 : 14,
                borderBottomLeftRadius: mine ? 14 : 4,
                paddingVertical: 8,
                paddingHorizontal: 12,
                gap: 2,
              }}
            >
              {isGroup && !mine ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.primary,
                  }}
                >
                  {item.sender_name}
                </Text>
              ) : null}
              <Text style={{ color: mine ? "#fff" : colors.text }}>
                {item.body}
              </Text>
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

      {/* Composer */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            padding: 12,
            gap: 8,
          }}
        >
          {error ? <ErrorText>{error}</ErrorText> : null}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.field,
                borderRadius: 999,
                paddingVertical: 11,
                paddingHorizontal: 16,
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
    </View>
  );
}
