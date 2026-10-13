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
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

interface Person {
  id: string;
  full_name: string;
  role: string;
}

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
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const create = async () => {
    setError(null);
    if (selected.length === 0) return setError("Pick at least one person.");
    if (selected.length > 1 && !name.trim()) return setError("Enter a group name.");
    setBusy(true);
    try {
      const conv = await api<{ id: string }>("/chat/conversations", {
        method: "POST",
        body: {
          user_ids: selected,
          name: selected.length > 1 ? name.trim() : undefined,
        },
      });
      router.replace({ pathname: "/chat-room", params: { id: conv.id } } as any);
    } catch (e: any) {
      setError(e?.message ?? "Could not create chat");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={listContent}
      data={people}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 14 }}>
          <Button title="Back" variant="secondary" onPress={() => router.back()} />
          <Title>New chat</Title>
          <Muted>Pick one person for a direct chat, or several for a group.</Muted>
          {selected.length > 1 ? (
            <TextInput
              placeholder="Group name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={80}
              style={{
                backgroundColor: colors.field,
                borderRadius: 10,
                padding: 12,
                color: colors.text,
              }}
            />
          ) : null}
          <ErrorText>{error}</ErrorText>
          <Button
            title={
              selected.length > 1
                ? `Create group (${selected.length} people)`
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
                borderWidth: 2,
                borderColor: on ? colors.primary : "transparent",
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
                <Text style={{ fontSize: 18 }}>{on ? "✅" : "⬜"}</Text>
              </Row>
            </Card>
          </Pressable>
        );
      }}
    />
  );
}