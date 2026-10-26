import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  ErrorText,
  Field,
  Muted,
  Title,
  listContent,
  listStyle,
  toneFor,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
  role: string;
  employment_status: string;
  attendance_points: number;
  avatar_url?: string | null;
  departments: { name: string } | null;
  progression_levels: { name: string } | null;
}

export default function EmployeesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (term: string) => {
    try {
      setError(null);
      const q = term.trim() ? `?search=${encodeURIComponent(term.trim())}` : "";
      setRows(await api<Employee[]>(`/employees${q}`));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load employees");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => load(search), 300);
      return () => clearTimeout(t);
    }, [search, load]),
  );

  return (
    <FlatList
      style={listStyle}
      contentContainerStyle={listContent}
      data={rows}
      keyExtractor={(e) => String(e.id)}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Title>Employees</Title>
            <Button
              small
              title="+ Add"
              onPress={() => router.push("/employee-new" as any)}
            />
          </View>
          <Field
            placeholder="Search by name"
            value={search}
            onChangeText={setSearch}
          />
          <ErrorText>{error}</ErrorText>
          <Muted>{rows.length} employee(s)</Muted>
        </View>
      }
      ListEmptyComponent={<Empty text="No employees found." />}
      renderItem={({ item }) => (
        <Card
          onPress={() =>
            router.push({
              pathname: "/employee-detail",
              params: { id: item.id },
            } as any)
          }
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Avatar name={item.full_name} uri={item.avatar_url} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: colors.text }}
              numberOfLines={1}
            >
              {item.full_name}
              {item.role === "admin" ? "  (admin)" : ""}
            </Text>
            <Muted>
              {[item.position, item.departments?.name]
                .filter(Boolean)
                .join(" · ") || "No position"}
            </Muted>
            <Muted>
              {item.progression_levels?.name ?? "No level"} ·{" "}
              {item.attendance_points} pts
            </Muted>
          </View>
          <Badge
            text={item.employment_status}
            tone={toneFor(item.employment_status)}
          />
        </Card>
      )}
    />
  );
}
