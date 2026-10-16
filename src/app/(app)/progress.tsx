import {
  Badge,
  Card,
  CardTitle,
  Center,
  Divider,
  ErrorText,
  Muted,
  PageHeader,
  Row,
  Screen,
  Stat,
  StatGrid,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
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

const label = (key: string) =>
  key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export default function ProgressScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

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
  const milestones = data?.milestones ?? [];
  const history = data?.history ?? [];

  const hero = p ? (
    <View
      style={{
        backgroundColor: colors.navy,
        borderRadius: 16,
        padding: 22,
        gap: 14,
      }}
    >
      <Row
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: "#9AA0C9", fontSize: 12 }}>Current level</Text>
          <Text style={{ color: "#fff", fontSize: 30, fontWeight: "700" }}>
            {p.current_level?.name ?? "-"}
          </Text>
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trophy-outline" size={22} color="#fff" />
        </View>
      </Row>

      <Row style={{ flexWrap: "wrap", gap: 10 }}>
        <Row style={{ gap: 6 }}>
          <Ionicons name="arrow-forward" size={14} color="#C9CDE8" />
          <Text style={{ color: "#C9CDE8", fontSize: 13 }}>
            {p.next_level
              ? `Next level: ${p.next_level.name}`
              : "Highest level reached"}
          </Text>
        </Row>
        {p.next_level ? (
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: p.eligible
                ? "rgba(18,161,80,0.22)"
                : "rgba(255,255,255,0.12)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: p.eligible ? "#7BE3A6" : "#C9CDE8",
              }}
            >
              {p.eligible ? "Eligible for promotion" : "Not eligible yet"}
            </Text>
          </View>
        ) : null}
      </Row>
    </View>
  ) : (
    <Card>
      <Muted>No progress data yet.</Muted>
    </Card>
  );

  const milestonesCard = (
    <Card style={{ gap: 14 }}>
      <CardTitle title="Milestones" subtitle="Your achievements" />
      {milestones.length === 0 ? <Muted>No milestones yet.</Muted> : null}
      {milestones.map((m, i) => (
        <View key={String(m.id)} style={{ gap: 14 }}>
          {i > 0 ? <Divider /> : null}
          <Row style={{ alignItems: "flex-start", gap: 12 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="flag-outline" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{ fontWeight: "600", color: colors.text, fontSize: 14 }}
              >
                {m.title}
              </Text>
              {m.description ? (
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  {m.description}
                </Text>
              ) : null}
              <Muted>{m.achieved_on}</Muted>
            </View>
          </Row>
        </View>
      ))}
    </Card>
  );

  const historyCard = (
    <Card style={{ gap: 14 }}>
      <CardTitle
        title="History"
        subtitle="Promotions and changes to your record"
      />
      {history.length === 0 ? <Muted>No history yet.</Muted> : null}
      {history.map((h, i) => (
        <View key={String(h.id)} style={{ gap: 14 }}>
          {i > 0 ? <Divider /> : null}
          <View style={{ gap: 6 }}>
            <Row style={{ flexWrap: "wrap" }}>
              <Badge text={h.kind} tone="info" />
              <Text
                style={{
                  fontWeight: "600",
                  color: colors.text,
                  fontSize: 14,
                  flexShrink: 1,
                }}
              >
                {h.title}
              </Text>
            </Row>
            {h.notes ? (
              <Text style={{ color: colors.text, fontSize: 13 }}>
                {h.notes}
              </Text>
            ) : null}
            <Muted>{h.effective_date ?? h.created_at.slice(0, 10)}</Muted>
          </View>
        </View>
      ))}
    </Card>
  );

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <PageHeader
        title="Progress"
        subtitle="Your level, milestones and history"
      />
      <ErrorText>{error}</ErrorText>

      {hero}

      {extras.length > 0 ? (
        <StatGrid>
          {extras.map(([k, v]) => (
            <Stat key={k} label={label(k)} value={String(v)} />
          ))}
        </StatGrid>
      ) : null}

      {wide ? (
        <View
          style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1 }}>{milestonesCard}</View>
          <View style={{ flex: 1 }}>{historyCard}</View>
        </View>
      ) : (
        <>
          {milestonesCard}
          {historyCard}
        </>
      )}
    </Screen>
  );
}
