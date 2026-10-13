import { useCallback, useState } from "react";
import { ScrollView, Pressable, Text, TextInput, View } from "react-native";
import { api, downloadFile } from "@/lib/api";
import { Button, Card, ErrorText, Muted, Screen, Title } from "@/components/ui";
import { colors } from "@/theme";

type ReportType = "attendance" | "late" | "absence" | "overtime" | "progression";
const TYPES: { key: ReportType; label: string }[] = [
  { key: "attendance", label: "Attendance" },
  { key: "late", label: "Late" },
  { key: "absence", label: "Absence" },
  { key: "overtime", label: "Overtime" },
  { key: "progression", label: "Progression" },
];

interface Report {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  total: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const firstOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const inputStyle = {
  backgroundColor: colors.field,
  borderRadius: 10,
  padding: 12,
  color: colors.text,
} as const;

export default function ReportsScreen() {
  const [type, setType] = useState<ReportType>("attendance");
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayStr);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProgression = type === "progression";

  const query = (format: string) =>
    isProgression
      ? `/reports/progression?format=${format}`
      : `/reports/attendance?type=${type}&from=${from.trim()}&to=${to.trim()}&format=${format}`;

  const valid = isProgression || (DATE_RE.test(from.trim()) && DATE_RE.test(to.trim()) && to >= from);

  const fileName = (ext: string) =>
    isProgression
      ? `progression-report-${todayStr}.${ext}`
      : `${type}-report-${from.trim()}-to-${to.trim()}.${ext}`;

  const run = useCallback(async () => {
    setError(null);
    if (!valid) return setError("Enter valid dates (YYYY-MM-DD). The end date must not be before the start date.");
    setLoading(true);
    try {
      setReport(await api<Report>(query("json")));
    } catch (e: any) {
      setReport(null);
      setError(e?.message ?? "Could not load the report");
    } finally {
      setLoading(false);
    }
  }, [type, from, to, valid]);

  const exportAs = async (format: "pdf" | "xlsx") => {
    setError(null);
    if (!valid) return setError("Enter valid dates first.");
    setExporting(format);
    try {
      await downloadFile(query(format), fileName(format));
    } catch (e: any) {
      setError(e?.message ?? "Could not download the file");
    } finally {
      setExporting(null);
    }
  };

  return (
    <Screen>
      <Title>Reports</Title>

      <Card>
        <Text style={{ fontWeight: "700", color: colors.muted, fontSize: 13 }}>Report type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TYPES.map((t) => {
            const on = type === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  setType(t.key);
                  setReport(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: on ? colors.primary : colors.field,
                }}
              >
                <Text style={{ color: on ? "#fff" : colors.text, fontWeight: "700" }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!isProgression ? (
          <>
            <Text style={{ fontWeight: "700", color: colors.muted, fontSize: 13 }}>From</Text>
            <TextInput style={inputStyle} value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted} autoCapitalize="none" />
            <Text style={{ fontWeight: "700", color: colors.muted, fontSize: 13 }}>To</Text>
            <TextInput style={inputStyle} value={to} onChangeText={setTo} placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted} autoCapitalize="none" />
          </>
        ) : (
          <Muted>Shows each employee's current level, points and eligibility for the next level.</Muted>
        )}

        <ErrorText>{error}</ErrorText>
        <Button title="Generate report" onPress={run} loading={loading} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button style={{ flex: 1 }} variant="secondary" title="Download PDF"
            onPress={() => exportAs("pdf")} loading={exporting === "pdf"} />
          <Button style={{ flex: 1 }} variant="secondary" title="Download Excel"
            onPress={() => exportAs("xlsx")} loading={exporting === "xlsx"} />
        </View>
      </Card>

      {report ? (
        <Card>
          <Text style={{ fontWeight: "800", color: colors.text }}>{report.title}</Text>
          <Muted>{report.total} record{report.total === 1 ? "" : "s"}</Muted>
          {report.total === 0 ? <Muted>No records for this period.</Muted> : (
            <ScrollView horizontal>
              <View>
                <View style={{ flexDirection: "row" }}>
                  {report.columns.map((c) => (
                    <Text key={c} style={{ width: 120, fontWeight: "800", color: colors.text, fontSize: 12 }}>{c}</Text>
                  ))}
                </View>
                {report.rows.slice(0, 200).map((r, i) => (
                  <View key={i} style={{ flexDirection: "row", paddingVertical: 4,
                    borderTopWidth: 1, borderTopColor: colors.border }}>
                    {r.map((cell, j) => (
                      <Text key={j} style={{ width: 120, color: colors.text, fontSize: 12 }}>{String(cell)}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          {report.total > 200 ? <Muted>Showing the first 200 rows. Download the file for all of them.</Muted> : null}
        </Card>
      ) : null}
    </Screen>
  );
}