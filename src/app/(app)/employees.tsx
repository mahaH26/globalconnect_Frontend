import { api } from "@/lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
  role: string;
  employment_status: string;
  attendance_points: number;
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

  // Runs when the screen is focused and when the search text changes
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => load(search), 300);
      return () => clearTimeout(t);
    }, [search, load]),
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(e) => String(e.id)}
      ListHeaderComponent={
        <View>
          <Text>Employees</Text>
          <TouchableOpacity onPress={() => router.push("/employee-new" as any)}>
            <Text>+ Add employee</Text>
          </TouchableOpacity>
          <TextInput
            placeholder="Search by name"
            value={search}
            onChangeText={setSearch}
          />
          {error && <Text>{error}</Text>}
        </View>
      }
      ListEmptyComponent={<Text>No employees found.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/employee-detail",
              params: { id: item.id },
            } as any)
          }
        >
          <Text>
            {item.full_name} ({item.role})
          </Text>
          <Text>
            {item.position ?? "-"} | {item.departments?.name ?? "No department"}{" "}
            | {item.progression_levels?.name ?? "No level"}
          </Text>
          <Text>
            {item.employment_status} | Points: {item.attendance_points}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}