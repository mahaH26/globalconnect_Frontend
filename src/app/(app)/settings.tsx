import {
  BackButton,
  Button,
  Collapsible,
  Divider,
  ErrorText,
  Field,
  FieldRow,
  Muted,
  Notice,
  Row,
  Screen,
  Title,
} from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

interface WorkSettings {
  work_start: string;
  work_end: string;
  grace_minutes: number;
  weekend_days: number[];
  points_on_time: number;
  points_late: number;
}
interface Office {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
}
interface Department {
  id: string;
  name: string;
}
interface Policy {
  leave_type: string;
  days_per_year: number | null;
}
interface Level {
  id: string;
  level_no: number;
  name: string;
  min_points: number;
  min_months: number;
}
interface Config {
  settings: WorkSettings;
  offices: Office[];
  departments: Department[];
  leave_policies: Policy[];
  levels: Level[];
}
interface OfficeForm {
  name: string;
  address: string;
  lat: string;
  lng: string;
  radius: string;
}
interface LevelForm {
  level_no: string;
  name: string;
  min_points: string;
  min_months: string;
}

const EMPTY_OFFICE: OfficeForm = {
  name: "",
  address: "",
  lat: "",
  lng: "",
  radius: "100",
};
const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s));

// Compact buttons that never stretch to full width
const BTN = { alignSelf: "flex-start" } as const;

function officeBody(v: OfficeForm) {
  const latitude = toNum(v.lat);
  const longitude = toNum(v.lng);
  const radius_m = toNum(v.radius);
  if (!v.name.trim()) return null;
  if (![latitude, longitude, radius_m].every((n) => Number.isFinite(n)))
    return null;
  if (!Number.isInteger(radius_m)) return null;
  return {
    name: v.name.trim(),
    address: v.address.trim() || null,
    latitude,
    longitude,
    radius_m,
  };
}

function levelBody(v: LevelForm) {
  const level_no = toNum(v.level_no);
  const min_points = toNum(v.min_points);
  const min_months = toNum(v.min_months);
  if (!v.name.trim()) return null;
  if (![level_no, min_points, min_months].every((n) => Number.isInteger(n)))
    return null;
  return { level_no, name: v.name.trim(), min_points, min_months };
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      {children}
      <Divider />
    </View>
  );
}

const SubTitle = ({ children }: { children: string }) => (
  <Text
    style={{
      color: colors.text,
      fontWeight: "700",
      fontSize: 14,
      marginTop: 4,
    }}
  >
    {children}
  </Text>
);

function PolicyRow({
  p,
  onSave,
}: {
  p: Policy;
  onSave: (type: string, days: string) => void;
}) {
  const [days, setDays] = useState(
    p.days_per_year === null ? "" : String(p.days_per_year),
  );
  return (
    <Row style={{ alignItems: "flex-end" }}>
      <Field
        containerStyle={{ flex: 1 }}
        label={`${p.leave_type} - days per year (empty = unlimited)`}
        value={days}
        onChangeText={setDays}
        keyboardType="numeric"
      />
      <Button
        small
        title="Save"
        onPress={() => onSave(p.leave_type, days)}
        style={{ marginBottom: 2 }}
      />
    </Row>
  );
}

function DepartmentRow({
  d,
  onRename,
  onDelete,
}: {
  d: Department;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(d.name);
  const [confirm, setConfirm] = useState(false);
  return (
    <Row style={{ flexWrap: "wrap" }}>
      <Field
        containerStyle={{ flexGrow: 1, flexBasis: 200 }}
        value={name}
        onChangeText={setName}
      />
      <Button small title="Save" onPress={() => onRename(d.id, name)} />
      <Button
        small
        variant={confirm ? "danger" : "secondary"}
        title={confirm ? "Confirm delete" : "Delete"}
        onPress={() => (confirm ? onDelete(d.id) : setConfirm(true))}
      />
    </Row>
  );
}

function OfficeFields({
  v,
  setV,
}: {
  v: OfficeForm;
  setV: (v: OfficeForm) => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const find = async () => {
    if (!v.address.trim()) return setNote("Type an address first.");
    setBusy(true);
    setNote(null);
    try {
      const r = await api<{
        latitude: number;
        longitude: number;
        display_name: string;
      }>(`/settings/geocode?q=${encodeURIComponent(v.address.trim())}`);
      setV({ ...v, lat: String(r.latitude), lng: String(r.longitude) });
      setNote(
        `Found: ${r.display_name}. Check it on the Locations map before relying on it.`,
      );
    } catch (e: any) {
      setNote(
        e?.message ??
          "Address not found. Paste coordinates from Google Maps instead.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Name"
        value={v.name}
        onChangeText={(t) => setV({ ...v, name: t })}
      />
      <Field
        label="Address"
        value={v.address}
        onChangeText={(t) => setV({ ...v, address: t })}
        placeholder="Office 41, Building 435G, Road 1805, Manama"
      />
      <Button
        small
        variant="secondary"
        style={BTN}
        title={busy ? "Searching..." : "Find coordinates from address"}
        onPress={find}
      />
      {note ? <Muted>{note}</Muted> : null}
      <FieldRow>
        <Field
          half
          label="Radius (meters, 10-5000)"
          value={v.radius}
          onChangeText={(t) => setV({ ...v, radius: t })}
          keyboardType="numeric"
        />
        <Field
          half
          label="Latitude (used for distance check)"
          value={v.lat}
          onChangeText={(t) => setV({ ...v, lat: t })}
        />
        <Field
          half
          label="Longitude (used for distance check)"
          value={v.lng}
          onChangeText={(t) => setV({ ...v, lng: t })}
        />
      </FieldRow>
    </View>
  );
}

function OfficeRow({
  o,
  onSave,
  onDelete,
}: {
  o: Office;
  onSave: (id: string, v: OfficeForm) => void;
  onDelete: (id: string) => void;
}) {
  const [v, setV] = useState<OfficeForm>({
    name: o.name,
    address: o.address ?? "",
    lat: String(o.latitude),
    lng: String(o.longitude),
    radius: String(o.radius_m),
  });
  const [confirm, setConfirm] = useState(false);
  return (
    <Block>
      <OfficeFields v={v} setV={setV} />
      <Row>
        <Button small title="Save office" onPress={() => onSave(o.id, v)} />
        <Button
          small
          variant={confirm ? "danger" : "secondary"}
          title={confirm ? "Confirm delete" : "Delete"}
          onPress={() => (confirm ? onDelete(o.id) : setConfirm(true))}
        />
      </Row>
    </Block>
  );
}

function LevelFields({
  v,
  setV,
}: {
  v: LevelForm;
  setV: (v: LevelForm) => void;
}) {
  return (
    <FieldRow>
      <Field
        half
        label="Level number"
        value={v.level_no}
        onChangeText={(t) => setV({ ...v, level_no: t })}
        keyboardType="numeric"
      />
      <Field
        half
        label="Name"
        value={v.name}
        onChangeText={(t) => setV({ ...v, name: t })}
      />
      <Field
        half
        label="Minimum points"
        value={v.min_points}
        onChangeText={(t) => setV({ ...v, min_points: t })}
        keyboardType="numeric"
      />
      <Field
        half
        label="Minimum months"
        value={v.min_months}
        onChangeText={(t) => setV({ ...v, min_months: t })}
        keyboardType="numeric"
      />
    </FieldRow>
  );
}

function LevelRow({
  l,
  onSave,
}: {
  l: Level;
  onSave: (id: string, v: LevelForm) => void;
}) {
  const [v, setV] = useState<LevelForm>({
    level_no: String(l.level_no),
    name: l.name,
    min_points: String(l.min_points),
    min_months: String(l.min_months),
  });
  return (
    <Block>
      <LevelFields v={v} setV={setV} />
      <Button
        small
        style={BTN}
        title="Save level"
        onPress={() => onSave(l.id, v)}
      />
    </Block>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [graceText, setGraceText] = useState("");
  const [weekendText, setWeekendText] = useState("");
  const [onTimeText, setOnTimeText] = useState("");
  const [lateText, setLateText] = useState("");

  const [newDept, setNewDept] = useState("");
  const [newOffice, setNewOffice] = useState<OfficeForm>(EMPTY_OFFICE);
  const [newLevel, setNewLevel] = useState<LevelForm>({
    level_no: "",
    name: "",
    min_points: "",
    min_months: "",
  });

  const load = useCallback(async () => {
    try {
      const c = await api<Config>("/settings");
      setCfg(c);
      setWorkStart(c.settings.work_start);
      setWorkEnd(c.settings.work_end);
      setGraceText(String(c.settings.grace_minutes));
      setWeekendText(c.settings.weekend_days.join(","));
      setOnTimeText(String(c.settings.points_on_time));
      setLateText(String(c.settings.points_late));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load settings");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setError(null);
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    }
  };

  const saveWork = () => {
    const grace = toNum(graceText);
    const onTime = toNum(onTimeText);
    const late = toNum(lateText);
    const weekend = weekendText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);
    if ([grace, onTime, late, ...weekend].some((n) => !Number.isInteger(n))) {
      setError("Grace minutes, points and weekend days must be whole numbers");
      return;
    }
    run(
      () =>
        api("/settings", {
          method: "PATCH",
          body: {
            work_start: workStart.trim(),
            work_end: workEnd.trim(),
            grace_minutes: grace,
            weekend_days: weekend,
            points_on_time: onTime,
            points_late: late,
          },
        }),
      "Work settings saved",
    );
  };

  const savePolicy = (type: string, days: string) => {
    const value = days.trim() === "" ? null : Number(days);
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      setError("Days per year must be a whole number or empty");
      return;
    }
    run(
      () =>
        api(`/settings/leave-policies/${type}`, {
          method: "PATCH",
          body: { days_per_year: value },
        }),
      `${type} allowance saved`,
    );
  };

  const addDepartment = () => {
    if (!newDept.trim()) return;
    run(async () => {
      await api("/settings/departments", {
        method: "POST",
        body: { name: newDept.trim() },
      });
      setNewDept("");
    }, "Department added");
  };
  const renameDepartment = (id: string, name: string) =>
    run(
      () =>
        api(`/settings/departments/${id}`, {
          method: "PATCH",
          body: { name: name.trim() },
        }),
      "Department saved",
    );
  const deleteDepartment = (id: string) =>
    run(
      () => api(`/settings/departments/${id}`, { method: "DELETE" }),
      "Department deleted",
    );

  const saveOffice = (id: string, v: OfficeForm) => {
    const body = officeBody(v);
    if (!body) {
      setError(
        "Office needs a name, numeric latitude/longitude and a whole-number radius",
      );
      return;
    }
    run(
      () => api(`/settings/offices/${id}`, { method: "PATCH", body }),
      "Office saved",
    );
  };
  const addOffice = () => {
    const body = officeBody(newOffice);
    if (!body) {
      setError(
        "Office needs a name, numeric latitude/longitude and a whole-number radius",
      );
      return;
    }
    run(async () => {
      await api("/settings/offices", { method: "POST", body });
      setNewOffice(EMPTY_OFFICE);
    }, "Office added");
  };
  const deleteOffice = (id: string) =>
    run(
      () => api(`/settings/offices/${id}`, { method: "DELETE" }),
      "Office deleted",
    );

  const useMyLocation = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setError("Location permission is required.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setNewOffice((o) => ({
        ...o,
        lat: String(pos.coords.latitude),
        lng: String(pos.coords.longitude),
      }));
    } catch (e: any) {
      setError(e?.message ?? "Could not get location");
    }
  };

  const saveLevel = (id: string, v: LevelForm) => {
    const body = levelBody(v);
    if (!body) {
      setError(
        "Level needs a name and whole numbers for number, points and months",
      );
      return;
    }
    run(
      () => api(`/settings/levels/${id}`, { method: "PATCH", body }),
      "Level saved",
    );
  };
  const addLevel = () => {
    const body = levelBody(newLevel);
    if (!body) {
      setError(
        "Level needs a name and whole numbers for number, points and months",
      );
      return;
    }
    run(async () => {
      await api("/settings/levels", { method: "POST", body });
      setNewLevel({ level_no: "", name: "", min_points: "", min_months: "" });
    }, "Level added");
  };

  return (
    <Screen>
      <View
        style={{ width: "100%", maxWidth: 800, alignSelf: "center", gap: 14 }}
      >
        <BackButton onPress={() => router.back()} />
        <Title>Settings</Title>
        {error ? <ErrorText>{error}</ErrorText> : null}
        {msg ? <Notice tone="good">{msg}</Notice> : null}
        {!cfg && !error ? <Muted>Loading...</Muted> : null}

        {cfg && (
          <View style={{ gap: 12 }}>
            <Collapsible title="Work hours and points" defaultOpen>
              <FieldRow>
                <Field
                  half
                  label="Work start (HH:MM)"
                  value={workStart}
                  onChangeText={setWorkStart}
                  autoCapitalize="none"
                />
                <Field
                  half
                  label="Work end (HH:MM)"
                  value={workEnd}
                  onChangeText={setWorkEnd}
                  autoCapitalize="none"
                />
                <Field
                  half
                  label="Grace minutes"
                  value={graceText}
                  onChangeText={setGraceText}
                  keyboardType="numeric"
                />
                <Field
                  half
                  label="Weekend days (0-6, comma separated)"
                  value={weekendText}
                  onChangeText={setWeekendText}
                />
                <Field
                  half
                  label="Points for on-time check-in"
                  value={onTimeText}
                  onChangeText={setOnTimeText}
                  keyboardType="numeric"
                />
                <Field
                  half
                  label="Points for late check-in"
                  value={lateText}
                  onChangeText={setLateText}
                  keyboardType="numeric"
                />
              </FieldRow>
              <Button
                small
                style={BTN}
                title="Save work settings"
                onPress={saveWork}
              />
            </Collapsible>

            <Collapsible title="Leave allowances">
              {cfg.leave_policies.map((p) => (
                <PolicyRow key={p.leave_type} p={p} onSave={savePolicy} />
              ))}
            </Collapsible>

            <Collapsible title="Departments">
              {cfg.departments.map((d) => (
                <DepartmentRow
                  key={d.id}
                  d={d}
                  onRename={renameDepartment}
                  onDelete={deleteDepartment}
                />
              ))}
              <SubTitle>New department</SubTitle>
              <Row style={{ flexWrap: "wrap" }}>
                <Field
                  containerStyle={{ flexGrow: 1, flexBasis: 200 }}
                  placeholder="Department name"
                  value={newDept}
                  onChangeText={setNewDept}
                />
                <Button small title="Add" onPress={addDepartment} />
              </Row>
            </Collapsible>

            <Collapsible title="Office locations">
              {cfg.offices.map((o) => (
                <OfficeRow
                  key={o.id}
                  o={o}
                  onSave={saveOffice}
                  onDelete={deleteOffice}
                />
              ))}
              <SubTitle>New office</SubTitle>
              <OfficeFields v={newOffice} setV={setNewOffice} />
              <Row style={{ flexWrap: "wrap" }}>
                <Button
                  small
                  variant="secondary"
                  title="Use my current location"
                  onPress={useMyLocation}
                />
                <Button small title="Add office" onPress={addOffice} />
              </Row>
              <Muted>
                The address is the label people see. The check-in distance uses
                the latitude and longitude. For best accuracy, copy the
                coordinates from Google Maps (right-click the building).
              </Muted>
            </Collapsible>

            <Collapsible title="Progression levels">
              {cfg.levels.map((l) => (
                <LevelRow key={l.id} l={l} onSave={saveLevel} />
              ))}
              <SubTitle>New level</SubTitle>
              <LevelFields v={newLevel} setV={setNewLevel} />
              <Button small style={BTN} title="Add level" onPress={addLevel} />
            </Collapsible>
          </View>
        )}
      </View>
    </Screen>
  );
}
