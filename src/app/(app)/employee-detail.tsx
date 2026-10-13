import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

type Role = "employee" | "admin";
type Status = "active" | "probation" | "suspended" | "terminated";
const ROLES: Role[] = ["employee", "admin"];
const STATUSES: Status[] = ["active", "probation", "suspended", "terminated"];

interface Profile {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  joining_date: string | null;
  employment_status: Status;
  role: Role;
  department_id: string | null;
  attendance_points: number;
}

interface Department {
  id: string;
  name: string;
}

interface Overview {
  progress:
    | (Record<string, any> & {
        current_level?: { name: string } | null;
        next_level?: { name: string } | null;
        eligible?: boolean;
      })
    | null;
  history: { id: string; kind: string; title: string; notes: string | null; created_at: string }[];
  milestones: { id: string; title: string; description: string | null; achieved_on: string }[];
}

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const isSelf = me?.id === id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [joining, setJoining] = useState("");
  const [status, setStatus] = useState<Status>("active");
  const [role, setRole] = useState<Role>("employee");
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const [msTitle, setMsTitle] = useState("");
  const [msDesc, setMsDesc] = useState("");
  const [needForce, setNeedForce] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [p, o, cfg] = await Promise.all([
        api<Profile>(`/employees/${id}`),
        api<Overview>(`/progression/employees/${id}`),
        api<{ departments: Department[] }>("/settings"),
      ]);
      setProfile(p);
      setOverview(o);
      setDepartments(cfg.departments ?? []);
      setFullName(p.full_name);
      setPosition(p.position ?? "");
      setPhone(p.phone ?? "");
      setJoining(p.joining_date ?? "");
      setStatus(p.employment_status);
      setRole(p.role);
      setDepartmentId(p.department_id);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load employee");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setError(null);
    setMsg(null);
    try {
      await api(`/employees/${id}`, {
        method: "PATCH",
        body: {
          full_name: fullName.trim(),
          position: position.trim() || null,
          phone: phone.trim() || null,
          department_id: departmentId,
          ...(joining.trim() ? { joining_date: joining.trim() } : {}),
          // The backend refuses role/status changes on your own account
          ...(isSelf ? {} : { role, employment_status: status }),
        },
      });
      setMsg("Saved");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Could not save");
    }
  };

  const promote = async (force: boolean) => {
    setError(null);
    setMsg(null);
    try {
      await api(`/progression/promote/${id}`, {
        method: "POST",
        body: force ? { force: true } : {},
      });
      setNeedForce(false);
      setMsg("Promoted");
      await load();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409 && e.data?.progress) {
        setNeedForce(true);
      }
      setError(e?.message ?? "Could not promote");
    }
  };

  const addMilestone = async () => {
    setError(null);
    setMsg(null);
    if (!msTitle.trim()) {
      setError("Milestone title is required");
      return;
    }
    try {
      await api(`/progression/milestones/${id}`, {
        method: "POST",
        body: {
          title: msTitle.trim(),
          ...(msDesc.trim() ? { description: msDesc.trim() } : {}),
        },
      });
      setMsTitle("");
      setMsDesc("");
      setMsg("Milestone recorded");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Could not add milestone");
    }
  };

  const remove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    try {
      await api(`/employees/${id}`, { method: "DELETE" });
      router.back();
    } catch (e: any) {
      setConfirmRemove(false);
      setError(e?.message ?? "Could not deactivate");
    }
  };

  const p = overview?.progress;
  const extras = p
    ? Object.entries(p).filter(
        ([k, v]) =>
          !["current_level", "next_level", "eligible"].includes(k) &&
          (typeof v === "string" || typeof v === "number" || typeof v === "boolean"),
      )
    : [];

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()}>
        <Text>{"< Back"}</Text>
      </TouchableOpacity>
      <Text>{profile?.full_name ?? "Employee"}</Text>
      {error && <Text>{error}</Text>}
      {msg && <Text>{msg}</Text>}

      {profile && (
        <View>
          <Text>Details (points: {profile.attendance_points})</Text>
          <TextInput placeholder="Full name" value={fullName} onChangeText={setFullName} />
          <TextInput placeholder="Position" value={position} onChangeText={setPosition} />
          <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} />
          <TextInput
            placeholder="Joining date (YYYY-MM-DD)"
            value={joining}
            onChangeText={setJoining}
            autoCapitalize="none"
          />

          <Text>Department</Text>
          <TouchableOpacity onPress={() => setDepartmentId(null)}>
            <Text>{departmentId === null ? "● " : "○ "}No department</Text>
          </TouchableOpacity>
          {departments.map((d) => (
            <TouchableOpacity key={d.id} onPress={() => setDepartmentId(d.id)}>
              <Text>
                {departmentId === d.id ? "● " : "○ "}
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}

          {isSelf ? (
            <Text>You can't change your own role or status.</Text>
          ) : (
            <View>
              <Text>Role</Text>
              {ROLES.map((r) => (
                <TouchableOpacity key={r} onPress={() => setRole(r)}>
                  <Text>
                    {role === r ? "● " : "○ "}
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text>Status</Text>
              {STATUSES.map((s) => (
                <TouchableOpacity key={s} onPress={() => setStatus(s)}>
                  <Text>
                    {status === s ? "● " : "○ "}
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={save}>
            <Text>Save changes</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text>Progress</Text>
      {p ? (
        <View>
          <Text>Current level: {p.current_level?.name ?? "-"}</Text>
          <Text>
            Next level: {p.next_level ? p.next_level.name : "Highest level reached"}
          </Text>
          {p.next_level && (
            <Text>{p.eligible ? "Eligible for promotion" : "Not eligible yet"}</Text>
          )}
          {extras.map(([k, v]) => (
            <Text key={k}>
              {k.replace(/_/g, " ")}: {String(v)}
            </Text>
          ))}
          {p.next_level && (
            <View>
              <TouchableOpacity onPress={() => promote(false)}>
                <Text>Promote to {p.next_level.name}</Text>
              </TouchableOpacity>
              {needForce && (
                <TouchableOpacity onPress={() => promote(true)}>
                  <Text>Not eligible - promote anyway</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        <Text>No progress data.</Text>
      )}

      <Text>Add milestone</Text>
      <TextInput placeholder="Title" value={msTitle} onChangeText={setMsTitle} />
      <TextInput
        placeholder="Description (optional)"
        value={msDesc}
        onChangeText={setMsDesc}
        multiline
      />
      <TouchableOpacity onPress={addMilestone}>
        <Text>Record milestone</Text>
      </TouchableOpacity>

      <Text>Milestones</Text>
      {(overview?.milestones ?? []).length === 0 && <Text>None yet.</Text>}
      {(overview?.milestones ?? []).map((m) => (
        <View key={String(m.id)}>
          <Text>
            {m.title} ({m.achieved_on})
          </Text>
          {m.description ? <Text>{m.description}</Text> : null}
        </View>
      ))}

      <Text>History</Text>
      {(overview?.history ?? []).length === 0 && <Text>None yet.</Text>}
      {(overview?.history ?? []).map((h) => (
        <View key={String(h.id)}>
          <Text>
            {h.kind} - {h.title}
          </Text>
          {h.notes ? <Text>{h.notes}</Text> : null}
          <Text>{h.created_at.slice(0, 10)}</Text>
        </View>
      ))}

      {!isSelf && profile && (
        <TouchableOpacity onPress={remove}>
          <Text>
            {confirmRemove
              ? "Tap again to confirm: deactivate and block login"
              : "Deactivate employee"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}