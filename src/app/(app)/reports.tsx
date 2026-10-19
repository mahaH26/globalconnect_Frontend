import CalendarPicker from "@/components/CalendarPicker";
import {
  Badge,
  Button,
  Card,
  Divider,
  ErrorText,
  Muted,
  PageHeader,
  Screen,
} from "@/components/ui";
import { api, downloadFile } from "@/lib/api";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

// Company logo (transparent PNG): <project root>/assets/logo/logo.png
const LOGO = require("../../../assets/logo/logo.png");

type IconName = ComponentProps<typeof Ionicons>["name"];

type ReportType =
  | "attendance"
  | "late"
  | "absence"
  | "overtime"
  | "progression";

const TYPES: { key: ReportType; label: string; icon: IconName }[] = [
  { key: "attendance", label: "Attendance", icon: "calendar-outline" },
  { key: "late", label: "Late", icon: "time-outline" },
  { key: "absence", label: "Absence", icon: "person-remove-outline" },
  { key: "overtime", label: "Overtime", icon: "hourglass-outline" },
  { key: "progression", label: "Progression", icon: "trending-up-outline" },
];

interface Report {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  total: number;
}

// Bahrain is UTC+3 all year (same rule as CalendarPicker)
const bahrain = () => new Date(Date.now() + 3 * 3600 * 1000);
const todayStr = bahrain().toISOString().slice(0, 10);
const firstOfMonth = `${todayStr.slice(0, 7)}-01`;
const stamp = () => bahrain().toISOString().slice(0, 16).replace("T", " ");

const SOFT = "#5B6385";
const BREAKPOINT = 640;
const MAX_ROWS = 200;

const Label = ({ children }: { children: string }) => (
  <Text
    style={{
      fontWeight: "600",
      color: SOFT,
      fontSize: 12,
      marginBottom: 8,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    }}
  >
    {children}
  </Text>
);

export default function ReportsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= BREAKPOINT;
  const colW = wide ? 140 : 120;

  const [type, setType] = useState<ReportType>("attendance");
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayStr);
  const [report, setReport] = useState<Report | null>(null);
  const [generatedAt, setGeneratedAt] = useState("");
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
      setGeneratedAt(stamp());
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

  const typeLabel = TYPES.find((t) => t.key === type)?.label ?? "";
  const period = isProgression ? "Current status" : `${from}  to  ${to}`;

  return (
    <Screen>
      <View
        style={{ width: "100%", maxWidth: 960, alignSelf: "center", gap: 16 }}
      >
        <PageHeader
          title="Reports"
          subtitle="Generate, preview and export staff reports"
        />

        {/* ───────── Builder ───────── */}
        <Card style={{ gap: 22 }}>
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
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: on ? colors.primary : colors.border,
                      backgroundColor: on
                        ? colors.accentSoft
                        : s.hovered
                          ? "#F4F5FA"
                          : "#FFFFFF",
                    })}
                  >
                    <Ionicons
                      name={t.icon}
                      size={15}
                      color={on ? colors.primary : SOFT}
                    />
                    <Text
                      style={{
                        color: on ? colors.primary : SOFT,
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
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "flex-start",
                backgroundColor: colors.navySoft,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={SOFT}
                style={{ marginTop: 1 }}
              />
              <Text
                style={{ flex: 1, color: SOFT, fontSize: 13, lineHeight: 19 }}
              >
                Shows each employee's current level, points and eligibility for
                the next level.
              </Text>
            </View>
          )}

          {error ? <ErrorText>{error}</ErrorText> : null}

          <Divider />

          {/* Actions */}
          <View
            style={{
              flexDirection: wide ? "row" : "column",
              alignItems: wide ? "center" : "stretch",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Button
              style={wide ? { minWidth: 180 } : undefined}
              title="Generate report"
              icon="document-text-outline"
              onPress={run}
              loading={loading}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                style={{ flex: wide ? undefined : 1 }}
                variant="secondary"
                title="PDF"
                icon="download-outline"
                onPress={() => exportAs("pdf")}
                loading={exporting === "pdf"}
              />
              <Button
                style={{ flex: wide ? undefined : 1 }}
                variant="secondary"
                title="Excel"
                icon="grid-outline"
                onPress={() => exportAs("xlsx")}
                loading={exporting === "xlsx"}
              />
            </View>
          </View>
        </Card>

        {/* ───────── Empty hint ───────── */}
        {!report && !loading ? (
          <View
            style={{
              alignItems: "center",
              gap: 10,
              paddingVertical: 36,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.border,
              borderRadius: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.navySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bar-chart-outline" size={20} color={SOFT} />
            </View>
            <Text
              style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}
            >
              No report yet
            </Text>
            <Muted>
              Pick a type and press Generate report to preview it here.
            </Muted>
          </View>
        ) : null}

        {/* ───────── Report "paper" ───────── */}
        {report ? (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {/* Letterhead: logo instead of text */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                paddingHorizontal: wide ? 24 : 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Image
                source={LOGO}
                resizeMode="contain"
                style={{ width: wide ? 150 : 110, height: wide ? 44 : 36 }}
              />
              <View style={{ alignItems: "flex-end", gap: 2 }}>
                <Text style={{ color: SOFT, fontSize: 11, letterSpacing: 0.6 }}>
                  GENERATED
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {generatedAt}
                </Text>
              </View>
            </View>

            {/* Title block */}
            <View
              style={{
                paddingHorizontal: wide ? 24 : 16,
                paddingTop: 20,
                paddingBottom: 16,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontWeight: "700",
                      color: colors.text,
                      fontSize: 20,
                    }}
                  >
                    {report.title}
                  </Text>
                  <Muted>{period}</Muted>
                </View>
                <Badge
                  text={`${report.total} record${report.total === 1 ? "" : "s"}`}
                  tone="info"
                />
              </View>
            </View>

            {/* Table */}
            <View
              style={{ paddingHorizontal: wide ? 24 : 16, paddingBottom: 20 }}
            >
              {report.total === 0 ? (
                <View
                  style={{
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 28,
                    backgroundColor: "#FAFAFD",
                    borderRadius: 12,
                  }}
                >
                  <Ionicons name="file-tray-outline" size={22} color={SOFT} />
                  <Muted>No records for this period.</Muted>
                </View>
              ) : (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: "100%" }}>
                      <View
                        style={{
                          flexDirection: "row",
                          backgroundColor: colors.navySoft,
                          paddingVertical: 11,
                        }}
                      >
                        {report.columns.map((c) => (
                          <Text
                            key={c}
                            numberOfLines={1}
                            style={{
                              width: colW,
                              paddingHorizontal: 12,
                              fontWeight: "700",
                              color: SOFT,
                              fontSize: 11,
                              letterSpacing: 0.5,
                              textTransform: "uppercase",
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
                            paddingVertical: 11,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                            backgroundColor: i % 2 ? "#FAFAFD" : "#FFFFFF",
                          }}
                        >
                          {r.map((cell, j) => (
                            <Text
                              key={j}
                              numberOfLines={2}
                              style={{
                                width: colW,
                                paddingHorizontal: 12,
                                color: j === 0 ? colors.text : SOFT,
                                fontWeight: j === 0 ? "600" : "400",
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
                </View>
              )}

              {report.total > MAX_ROWS ? (
                <View style={{ marginTop: 12 }}>
                  <Muted>
                    Showing the first {MAX_ROWS} rows. Download the file to see
                    all of them.
                  </Muted>
                </View>
              ) : null}
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: wide ? "row" : "column",
                alignItems: wide ? "center" : "flex-start",
                justifyContent: "space-between",
                gap: 6,
                paddingHorizontal: wide ? 24 : 16,
                paddingVertical: 14,
                backgroundColor: "#FAFAFD",
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Image
                  source={LOGO}
                  resizeMode="contain"
                  style={{ width: 54, height: 18 }}
                />
                <Text style={{ color: SOFT, fontSize: 11 }}>
                  Global Connect · Staff portal
                </Text>
              </View>
              <Text style={{ color: SOFT, fontSize: 11 }}>
                {typeLabel} report · Confidential · For internal use only
              </Text>
            </View>
          </Card>
        ) : null}

        {/* Page footer */}
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            © {todayStr.slice(0, 4)} Global Connect. All rights reserved.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
