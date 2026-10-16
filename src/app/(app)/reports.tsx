import CalendarPicker from "@/components/CalendarPicker"; // adjust path if yours differs
import { Button, Card, ErrorText, Muted, Screen, Title } from "@/components/ui";
import { api, downloadFile } from "@/lib/api";
import { colors } from "@/theme";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

type ReportType =
  | "attendance"
  | "late"
  | "absence"
  | "overtime"
  | "progression";
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

const pad = (n: number) => String(n).padStart(2, "0");

// Bahrain is UTC+3 all year (same rule as CalendarPicker)
const todayStr = new Date(Date.now() + 3 * 3600 * 1000)
  .toISOString()
  .slice(0, 10);
const firstOfMonth = `${todayStr.slice(0, 7)}-01`;

const SOFT = "#5B6385";
const BREAKPOINT = 640;
const MAX_ROWS = 200;

const Label = ({ children }: { children: string }) => (
  <Text
    style={{ fontWeight: "600", color: SOFT, fontSize: 13, marginBottom: 6 }}
  >
    {children}
  </Text>
);

export default function ReportsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= BREAKPOINT;

  const [type, setType] = useState<ReportType>("attendance");
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayStr);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProgression = type === "progression";
  const valid = isProgression || (!!from && !!to && to >= from);

  const query = (format: string) =>
    isProgression
      ? `/reports/progression?format=${format}`
      : `/reports/attendance?type=${type}&from=${from}&to=${to}&format=${format}`;

  const fileName = (ext: string) =>
    isProgression
      ? `progression-report-${todayStr}.${ext}`
      : `${type}-report-${from}-to-${to}.${ext}`;

  const changeFrom = (v: string) => {
    setFrom(v);
    // keep the range valid: if start moves past end, move end with it
    if (v && to && v > to) setTo(v);
    setReport(null);
    setError(null);
  };

  const changeTo = (v: string) => {
    setTo(v);
    if (v && from && v < from) setFrom(v);
    setReport(null);
    setError(null);
  };

  const run = useCallback(async () => {
    setError(null);
    if (!valid)
      return setError(
        "Choose a start and end date. The end date can't be before the start date.",
      );
    setLoading(true);
    try {
      setReport(await api<Report>(query("json")));
    } catch (e: any) {
      setReport(null);
      setError(e?.message ?? "Could not load the report");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, from, to, valid]);

  const exportAs = async (format: "pdf" | "xlsx") => {
    setError(null);
    if (!valid) return setError("Choose a start and end date first.");
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
      <View
        style={{ width: "100%", maxWidth: 960, alignSelf: "center", gap: 16 }}
      >
        <Title>Reports</Title>

        <Card>
          <View style={{ gap: 20 }}>
            {/* Report type */}
            <View>
              <Label>Report type</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {TYPES.map((t) => {
                  const on = type === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => {
                        setType(t.key);
                        setReport(null);
                        setError(null);
                      }}
                      style={(s: any) => ({
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: on ? colors.primary : colors.border,
                        backgroundColor: on
                          ? colors.primary
                          : s.hovered
                            ? "#F4F5FA"
                            : "#FFFFFF",
                      })}
                    >
                      <Text
                        style={{
                          color: on ? "#fff" : SOFT,
                          fontWeight: on ? "700" : "500",
                          fontSize: 13,
                        }}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Dates */}
            {!isProgression ? (
              <View style={{ flexDirection: wide ? "row" : "column", gap: 16 }}>
                <View style={{ flex: wide ? 1 : undefined }}>
                  <Label>From</Label>
                  <CalendarPicker value={from} onChange={changeFrom} />
                </View>
                <View style={{ flex: wide ? 1 : undefined }}>
                  <Label>To</Label>
                  <CalendarPicker value={to} onChange={changeTo} />
                </View>
              </View>
            ) : (
              <Muted>
                Shows each employee's current level, points and eligibility for
                the next level.
              </Muted>
            )}

            {error ? <ErrorText>{error}</ErrorText> : null}

            {/* Actions */}
            <View
              style={{
                flexDirection: wide ? "row" : "column",
                alignItems: wide ? "center" : "stretch",
                gap: 10,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 16,
              }}
            >
              <Button
                style={wide ? { minWidth: 180 } : undefined}
                title="Generate report"
                onPress={run}
                loading={loading}
              />
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  flex: wide ? 0 : undefined,
                }}
              >
                <Button
                  style={{ flex: 1, minWidth: wide ? 140 : undefined }}
                  variant="secondary"
                  title="Download PDF"
                  onPress={() => exportAs("pdf")}
                  loading={exporting === "pdf"}
                />
                <Button
                  style={{ flex: 1, minWidth: wide ? 140 : undefined }}
                  variant="secondary"
                  title="Download Excel"
                  onPress={() => exportAs("xlsx")}
                  loading={exporting === "xlsx"}
                />
              </View>
            </View>
          </View>
        </Card>

        {report ? (
          <Card>
            <View style={{ gap: 12 }}>
              <View>
                <Text
                  style={{
                    fontWeight: "700",
                    color: colors.text,
                    fontSize: 16,
                  }}
                >
                  {report.title}
                </Text>
                <Muted>
                  {report.total} record{report.total === 1 ? "" : "s"}
                </Muted>
              </View>

              {report.total === 0 ? (
                <Muted>No records for this period.</Muted>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: "100%" }}>
                    <View
                      style={{
                        flexDirection: "row",
                        backgroundColor: "#F4F5FA",
                        borderRadius: 8,
                        paddingVertical: 8,
                      }}
                    >
                      {report.columns.map((c) => (
                        <Text
                          key={c}
                          numberOfLines={1}
                          style={{
                            width: 130,
                            paddingHorizontal: 10,
                            fontWeight: "700",
                            color: SOFT,
                            fontSize: 12,
                          }}
                        >
                          {c}
                        </Text>
                      ))}
                    </View>
                    {report.rows.slice(0, MAX_ROWS).map((r, i) => (
                      <View
                        key={i}
                        style={{
                          flexDirection: "row",
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }}
                      >
                        {r.map((cell, j) => (
                          <Text
                            key={j}
                            numberOfLines={2}
                            style={{
                              width: 130,
                              paddingHorizontal: 10,
                              color: colors.text,
                              fontSize: 13,
                            }}
                          >
                            {String(cell)}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {report.total > MAX_ROWS ? (
                <Muted>
                  Showing the first {MAX_ROWS} rows. Download the file to see
                  all of them.
                </Muted>
              ) : null}
            </View>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
