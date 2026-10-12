import { Center } from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

interface Level {
  id: string;
  name: string;
  level_no?: number;
}

interface HistoryEntry {
  id: string;
  kind: string;
  title: string;
  notes: string | null;
  effective_date: string | null;
  created_at: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  achieved_on: string;
}

interface Overview {
  progress:
    | (Record<string, any> & {
        current_level?: Level | null;
        next_level?: Level | null;
        eligible?: boolean;
      })
    | null;
  history: HistoryEntry[];
  milestones: Milestone[];
}

const label = (key: string) => key.replace(/_/g, " ");

export default function ProgressScreen() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api<Overview>("/progression/me"));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load progress");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Center>
        <ActivityIndicator size="large" color={colors.primary} />
      </Center>
    );
  }

  const p = data?.progress;
  // Other simple values in progress (points, days, etc.), shown generically
  const extras = p
    ? Object.entries(p).filter(
        ([k, v]) =>
          !["current_level", "next_level", "eligible"].includes(k) &&
          (typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean"),
      )
    : [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      <Text>Progress</Text>
      {error && <Text>{error}</Text>}

      {p ? (
        <View>
          <Text>Current level: {p.current_level?.name ?? "-"}</Text>
          <Text>
            Next level:{" "}
            {p.next_level ? p.next_level.name : "Highest level reached"}
          </Text>
          {p.next_level && (
            <Text>
              {p.eligible
                ? "You are eligible for promotion"
                : "Not eligible for promotion yet"}
            </Text>
          )}
          {extras.map(([k, v]) => (
            <Text key={k}>
              {label(k)}: {String(v)}
            </Text>
          ))}
        </View>
      ) : (
        <Text>No progress data yet.</Text>
      )}

      <Text>Milestones</Text>
      {(data?.milestones ?? []).length === 0 && <Text>No milestones yet.</Text>}
      {(data?.milestones ?? []).map((m) => (
        <View key={String(m.id)}>
          <Text>{m.title}</Text>
          {m.description ? <Text>{m.description}</Text> : null}
          <Text>{m.achieved_on}</Text>
        </View>
      ))}

      <Text>History</Text>
      {(data?.history ?? []).length === 0 && <Text>No history yet.</Text>}
      {(data?.history ?? []).map((h) => (
        <View key={String(h.id)}>
          <Text>
            {h.kind} - {h.title}
          </Text>
          {h.notes ? <Text>{h.notes}</Text> : null}
          <Text>{h.effective_date ?? h.created_at.slice(0, 10)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
