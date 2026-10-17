import {
  Badge,
  Card,
  CardTitle,
  Center,
  Divider,
  ErrorText,
  KV,
  Muted,
  PageHeader,
  Row,
  Screen,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
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

/** One entry on a vertical timeline: dot, thin line down to the next entry */
function TimelineItem({
  last,
  color = colors.primary,
  children,
}: {
  last: boolean;
  color?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 14 }}>
      <View style={{ alignItems: "center", width: 12, paddingTop: 5 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          }}
        />
        {last ? null : (
          <View
            style={{
              flex: 1,
              width: 1,
              backgroundColor: colors.border,
              marginTop: 4,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 18, gap: 3 }}>
        {children}
      </View>
    </View>
  );
}

function StatTile({ label: text, value }: { label: string; value: string }) {
  return (
    <Card style={{ padding: 16, gap: 0 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 26,
            fontWeight: "700",
            flexShrink: 1,
          }}
        >
          {value}
        </Text>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.navySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="stats-chart-outline" size={15} color="#5B6385" />
        </View>
      </View>
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>
        {text}
      </Text>
    </Card>
  );
}

export default function ProgressScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const cols = width >= 1000 ? 4 : width >= 700 ? 3 : 2;

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

  const levelCard = p ? (
    <Card style={{ gap: 14 }}>
      <Row style={{ gap: 10 }}>
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
          <Ionicons name="trophy-outline" size={17} color={colors.primary} />
        </View>
        <Muted>Current level</Muted>
      </Row>

      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700" }}>
        {p.current_level?.name ?? "-"}
      </Text>

      <Divider />

      {p.next_level ? (
        <View style={{ gap: 10 }}>
          <KV label="Next level" value={p.next_level.name} />
          <Badge
            text={p.eligible ? "Eligible for promotion" : "Not eligible yet"}
            tone={p.eligible ? "good" : "warn"}
          />
        </View>
      ) : (
        <Badge text="Highest level reached" tone="good" />
      )}
    </Card>
  ) : (
    <Card>
      <Muted>No progress data yet.</Muted>
    </Card>
  );

  const tiles =
    extras.length > 0 ? (
      <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -6 }}>
        {extras.map(([k, v]) => (
          <View key={k} style={{ width: `${100 / cols}%`, padding: 6 }}>
            <StatTile label={label(k)} value={String(v)} />
          </View>
        ))}
      </View>
    ) : null;

  const milestonesCard = (
    <Card style={{ gap: 16 }}>
      <CardTitle title="Milestones" subtitle="Your achievements" />
      {milestones.length === 0 ? <Muted>No milestones yet.</Muted> : null}
      <View>
        {milestones.map((m, i) => (
          <TimelineItem key={String(m.id)} last={i === milestones.length - 1}>
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
          </TimelineItem>
        ))}
      </View>
    </Card>
  );

  const historyCard = (
    <Card style={{ gap: 16 }}>
      <CardTitle
        title="History"
        subtitle="Promotions and changes to your record"
      />
      {history.length === 0 ? <Muted>No history yet.</Muted> : null}
      <View>
        {history.map((h, i) => (
          <TimelineItem
            key={String(h.id)}
            last={i === history.length - 1}
            color={colors.navy}
          >
            <Row style={{ flexWrap: "wrap", gap: 8 }}>
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
          </TimelineItem>
        ))}
      </View>
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

      {levelCard}
      {tiles}

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
