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
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

interface Person {
  id: string;
  full_name: string;
  role: string;
}

const SOFT = "#5B6385";

export default function ChatNew() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Person[]>("/chat/people")
      .then(setPeople)
      .catch((e: any) => setError(e?.message ?? "Failed to load people"));
  }, []);

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const create = async () => {
    setError(null);
    if (selected.length === 0) return setError("Pick at least one person.");
    if (selected.length > 1 && !name.trim())
      return setError("Enter a group name.");
    setBusy(true);
    try {
      const conv = await api<{ id: string }>("/chat/conversations", {
        method: "POST",
        body: {
          user_ids: selected,
          name: selected.length > 1 ? name.trim() : undefined,
        },
      });
      router.replace({
        pathname: "/chat-room",
        params: { id: conv.id },
      } as any);
    } catch (e: any) {
      setError(e?.message ?? "Could not create chat");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={[
        listContent,
        { width: "100%", maxWidth: 720, alignSelf: "center" },
      ]}
      data={people}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View style={{ gap: 14, marginBottom: 14 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="chevron-back" size={18} color={SOFT} />
            <Text style={{ color: SOFT, fontWeight: "600", fontSize: 13 }}>
              Back
            </Text>
          </Pressable>

          <View style={{ gap: 4 }}>
            <Title>New chat</Title>
            <Muted>
              Pick one person for a direct chat, or several for a group.
            </Muted>
          </View>

          {selected.length > 1 ? (
            <TextInput
              placeholder="Group name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={80}
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                color: colors.text,
              }}
            />
          ) : null}

          {error ? <ErrorText>{error}</ErrorText> : null}

          <Button
            style={{ alignSelf: "flex-start", minWidth: 180 }}
            title={
              selected.length > 1
                ? `Create group (${selected.length})`
                : "Start chat"
            }
            onPress={create}
            loading={busy}
          />
        </View>
      }
      ListEmptyComponent={<Empty text="No other users found." />}
      renderItem={({ item }) => {
        const on = selected.includes(item.id);
        return (
          <Pressable onPress={() => toggle(item.id)}>
            <Card
              style={{
                marginBottom: 10,
                borderWidth: 1,
                borderColor: on ? colors.primary : colors.border,
              }}
            >
              <Row>
                <Avatar name={item.full_name} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: colors.text }}>
                    {item.full_name}
                  </Text>
                  <Muted>{item.role}</Muted>
                </View>
                <Ionicons
                  name={on ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={on ? colors.primary : colors.muted}
                />
              </Row>
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
