import { api } from "@/lib/api";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

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

const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s));

function officeBody(v: OfficeForm) {
  const latitude = toNum(v.lat);
  const longitude = toNum(v.lng);
  const radius_m = toNum(v.radius);
  if (!v.name.trim()) return null;
  if (![latitude, longitude, radius_m].every((n) => Number.isFinite(n))) return null;
  if (!Number.isInteger(radius_m)) return null;
  return { name: v.name.trim(), latitude, longitude, radius_m };
}

function levelBody(v: LevelForm) {
  const level_no = toNum(v.level_no);
  const min_points = toNum(v.min_points);
  const min_months = toNum(v.min_months);
  if (!v.name.trim()) return null;
  if (![level_no, min_points, min_months].every((n) => Number.isInteger(n))) return null;
  return { level_no, name: v.name.trim(), min_points, min_months };
}

function PolicyRow({
  p,
  onSave,
}: {
  p: Policy;
  onSave: (type: string, days: string) => void;
}) {
  const [days, setDays] = useState(p.days_per_year === null ? "" : String(p.days_per_year));
  return (
    <View>
      <Text>{p.leave_type} - days per year (empty = unlimited)</Text>
      <TextInput value={days} onChangeText={setDays} keyboardType="numeric" />
      <TouchableOpacity onPress={() => onSave(p.leave_type, days)}>
        <Text>Save {p.leave_type}</Text>
      </TouchableOpacity>
    </View>
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
    <View>
      <TextInput value={name} onChangeText={setName} />
      <TouchableOpacity onPress={() => onRename(d.id, name)}>
        <Text>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => (confirm ? onDelete(d.id) : setConfirm(true))}>
        <Text>{confirm ? "Tap again to confirm delete" : "Delete"}</Text>
      </TouchableOpacity>
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
    lat: String(o.latitude),
    lng: String(o.longitude),
    radius: String(o.radius_m),
  });
  const [confirm, setConfirm] = useState(false);
  return (
    <View>
      <TextInput placeholder="Name" value={v.name} onChangeText={(t) => setV({ ...v, name: t })} />
      <TextInput placeholder="Latitude" value={v.lat} onChangeText={(t) => setV({ ...v, lat: t })} />
      <TextInput placeholder="Longitude" value={v.lng} onChangeText={(t) => setV({ ...v, lng: t })} />
      <TextInput
        placeholder="Radius in meters (10-5000)"
        value={v.radius}
        onChangeText={(t) => setV({ ...v, radius: t })}
        keyboardType="numeric"
      />
      <TouchableOpacity onPress={() => onSave(o.id, v)}>
        <Text>Save office</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => (confirm ? onDelete(o.id) : setConfirm(true))}>
        <Text>{confirm ? "Tap again to confirm delete" : "Delete office"}</Text>
      </TouchableOpacity>
    </View>
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
    <View>
      <TextInput placeholder="Level number" value={v.level_no} onChangeText={(t) => setV({ ...v, level_no: t })} keyboardType="numeric" />
      <TextInput placeholder="Name" value={v.name} onChangeText={(t) => setV({ ...v, name: t })} />
      <TextInput placeholder="Minimum points" value={v.min_points} onChangeText={(t) => setV({ ...v, min_points: t })} keyboardType="numeric" />
      <TextInput placeholder="Minimum months" value={v.min_months} onChangeText={(t) => setV({ ...v, min_months: t })} keyboardType="numeric" />
      <TouchableOpacity onPress={() => onSave(l.id, v)}>
        <Text>Save level</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen() {
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
  const [newOffice, setNewOffice] = useState<OfficeForm>({
    name: "",
    lat: "",
    lng: "",
    radius: "100",
  });
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
      await api("/settings/departments", { method: "POST", body: { name: newDept.trim() } });
      setNewDept("");
    }, "Department added");
  };

  const renameDepartment = (id: string, name: string) =>
    run(
      () => api(`/settings/departments/${id}`, { method: "PATCH", body: { name: name.trim() } }),
      "Department saved",
    );

  const deleteDepartment = (id: string) =>
    run(() => api(`/settings/departments/${id}`, { method: "DELETE" }), "Department deleted");

  const saveOffice = (id: string, v: OfficeForm) => {
    const body = officeBody(v);
    if (!body) {
      setError("Office needs a name, numeric latitude/longitude and a whole-number radius");
      return;
    }
    run(() => api(`/settings/offices/${id}`, { method: "PATCH", body }), "Office saved");
  };

  const addOffice = () => {
    const body = officeBody(newOffice);
    if (!body) {
      setError("Office needs a name, numeric latitude/longitude and a whole-number radius");
      return;
    }
    run(async () => {
      await api("/settings/offices", { method: "POST", body });
      setNewOffice({ name: "", lat: "", lng: "", radius: "100" });
    }, "Office added");
  };

  const deleteOffice = (id: string) =>
    run(() => api(`/settings/offices/${id}`, { method: "DELETE" }), "Office deleted");

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
      setError("Level needs a name and whole numbers for number, points and months");
      return;
    }
    run(() => api(`/settings/levels/${id}`, { method: "PATCH", body }), "Level saved");
  };

  const addLevel = () => {
    const body = levelBody(newLevel);
    if (!body) {
      setError("Level needs a name and whole numbers for number, points and months");
      return;
    }
    run(async () => {
      await api("/settings/levels", { method: "POST", body });
      setNewLevel({ level_no: "", name: "", min_points: "", min_months: "" });
    }, "Level added");
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Text>Settings</Text>
      {error && <Text>{error}</Text>}
      {msg && <Text>{msg}</Text>}
      {!cfg && !error && <Text>Loading...</Text>}

      {cfg && (
        <View>
          <Text>Work hours and points</Text>
          <TextInput placeholder="Work start (HH:MM)" value={workStart} onChangeText={setWorkStart} autoCapitalize="none" />
          <TextInput placeholder="Work end (HH:MM)" value={workEnd} onChangeText={setWorkEnd} autoCapitalize="none" />
          <TextInput placeholder="Grace minutes" value={graceText} onChangeText={setGraceText} keyboardType="numeric" />
          <TextInput placeholder="Weekend days, numbers 0-6 separated by commas" value={weekendText} onChangeText={setWeekendText} />
          <TextInput placeholder="Points for on-time check-in" value={onTimeText} onChangeText={setOnTimeText} keyboardType="numeric" />
          <TextInput placeholder="Points for late check-in" value={lateText} onChangeText={setLateText} keyboardType="numeric" />
          <TouchableOpacity onPress={saveWork}>
            <Text>Save work settings</Text>
          </TouchableOpacity>

          <Text>Leave allowances</Text>
          {cfg.leave_policies.map((p) => (
            <PolicyRow key={p.leave_type} p={p} onSave={savePolicy} />
          ))}

          <Text>Departments</Text>
          {cfg.departments.map((d) => (
            <DepartmentRow key={d.id} d={d} onRename={renameDepartment} onDelete={deleteDepartment} />
          ))}
          <TextInput placeholder="New department name" value={newDept} onChangeText={setNewDept} />
          <TouchableOpacity onPress={addDepartment}>
            <Text>Add department</Text>
          </TouchableOpacity>

          <Text>Office locations</Text>
          {cfg.offices.map((o) => (
            <OfficeRow key={o.id} o={o} onSave={saveOffice} onDelete={deleteOffice} />
          ))}
          <Text>New office</Text>
          <TextInput placeholder="Name" value={newOffice.name} onChangeText={(t) => setNewOffice({ ...newOffice, name: t })} />
          <TextInput placeholder="Latitude" value={newOffice.lat} onChangeText={(t) => setNewOffice({ ...newOffice, lat: t })} />
          <TextInput placeholder="Longitude" value={newOffice.lng} onChangeText={(t) => setNewOffice({ ...newOffice, lng: t })} />
          <TextInput placeholder="Radius in meters (10-5000)" value={newOffice.radius} onChangeText={(t) => setNewOffice({ ...newOffice, radius: t })} keyboardType="numeric" />
          <TouchableOpacity onPress={useMyLocation}>
            <Text>Use my current location (do this at the office)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addOffice}>
            <Text>Add office</Text>
          </TouchableOpacity>

          <Text>Progression levels</Text>
          {cfg.levels.map((l) => (
            <LevelRow key={l.id} l={l} onSave={saveLevel} />
          ))}
          <Text>New level</Text>
          <TextInput placeholder="Level number" value={newLevel.level_no} onChangeText={(t) => setNewLevel({ ...newLevel, level_no: t })} keyboardType="numeric" />
          <TextInput placeholder="Name" value={newLevel.name} onChangeText={(t) => setNewLevel({ ...newLevel, name: t })} />
          <TextInput placeholder="Minimum points" value={newLevel.min_points} onChangeText={(t) => setNewLevel({ ...newLevel, min_points: t })} keyboardType="numeric" />
          <TextInput placeholder="Minimum months" value={newLevel.min_months} onChangeText={(t) => setNewLevel({ ...newLevel, min_months: t })} keyboardType="numeric" />
          <TouchableOpacity onPress={addLevel}>
            <Text>Add level</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}