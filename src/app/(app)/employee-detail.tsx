import DateField from "@/components/DateField";
import {
  Avatar,
  BackButton,
  Badge,
  Button,
  Card,
  CardTitle,
  Chips,
  Divider,
  ErrorText,
  Field,
  FieldRow,
  KV,
  Muted,
  Notice,
  Row,
  Screen,
  Title,
  chipOptions,
  toneFor,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api } from "@/lib/api";
import { generatePassword } from "@/lib/password";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";

const ROLES = ["employee", "admin"] as const;
const STATUSES = ["active", "probation", "suspended", "terminated"] as const;
type Role = (typeof ROLES)[number];
type Status = (typeof STATUSES)[number];

interface Profile {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  joining_date: string | null;
  last_working_date?: string | null;
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
  history: {
    id: string;
    kind: string;
    title: string;
    notes: string | null;
    created_at: string;
  }[];
  milestones: {
    id: string;
    title: string;
    description: string | null;
    achieved_on: string;
  }[];
}

function IconDot({
  name,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accentSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={16} color={colors.primary} />
    </View>
  );
}

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const isSelf = me?.id === id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [joining, setJoining] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [status, setStatus] = useState<Status>("active");
  const [role, setRole] = useState<Role>("employee");
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const [newPw, setNewPw] = useState("");
  const [pwDone, setPwDone] = useState<string | null>(null);
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
      setLastDate(p.last_working_date ?? "");
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
    if (joining && lastDate && lastDate < joining) {
      setError("The last date can't be before the joining date");
      return;
    }
    try {
      await api(`/employees/${id}`, {
        method: "PATCH",
        body: {
          full_name: fullName.trim(),
          position: position.trim() || null,
          phone: phone.trim() || null,
          department_id: departmentId,
          last_working_date: lastDate || null,
          ...(joining ? { joining_date: joining } : {}),
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

  const setPassword = async () => {
    setError(null);
    setMsg(null);
    setPwDone(null);
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      await api(`/employees/${id}/password`, {
        method: "POST",
        body: { password: newPw },
      });
      setPwDone(newPw);
      setNewPw("");
    } catch (e: any) {
      setError(e?.message ?? "Could not set password");
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
      if (e instanceof ApiError && e.status === 409 && e.data?.progress)
        setNeedForce(true);
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
          (typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean"),
      )
    : [];
  const milestones = overview?.milestones ?? [];
  const history = overview?.history ?? [];

  const headerCard = profile ? (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Avatar name={profile.full_name} size={56} />
      <View style={{ flex: 1, gap: 4 }}>
        <Title>{profile.full_name}</Title>
        <Muted>{profile.position ?? "No position"}</Muted>
        <Row style={{ flexWrap: "wrap" }}>
          <Badge
            text={profile.employment_status}
            tone={toneFor(profile.employment_status)}
          />
          <Muted>{profile.attendance_points} points</Muted>
        </Row>
      </View>
    </Card>
  ) : null;

  const detailsCard = profile ? (
    <Card style={{ gap: 16 }}>
      <CardTitle
        title="Details"
        subtitle="Personal and employment information"
      />
      <FieldRow>
        <Field
          half
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <Field
          half
          label="Position"
          value={position}
          onChangeText={setPosition}
        />
        <Field
          half
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </FieldRow>
      <FieldRow>
        <DateField
          half
          label="Joining date"
          value={joining}
          onChange={setJoining}
        />
        <DateField
          half
          label="Last working date (optional)"
          value={lastDate}
          onChange={setLastDate}
          minDate={joining || undefined}
          placeholder="Not set"
        />
      </FieldRow>
      <Chips
        label="Department"
        options={[
          { value: "", label: "No department" },
          ...departments.map((d) => ({ value: d.id, label: d.name })),
        ]}
        value={departmentId ?? ""}
        onChange={(v) => setDepartmentId(v || null)}
      />
      {isSelf ? (
        <Muted>You can't change your own role or status.</Muted>
      ) : (
        <>
          <Chips
            label="Role"
            options={chipOptions(ROLES)}
            value={role}
            onChange={setRole}
          />
          <Chips
            label="Status"
            options={chipOptions(STATUSES)}
            value={status}
            onChange={setStatus}
          />
        </>
      )}
      <Button title="Save changes" icon="checkmark" onPress={save} />
    </Card>
  ) : null;

  const passwordCard = profile ? (
    <Card style={{ gap: 14 }}>
      <CardTitle
        title="Login password"
        subtitle="Set a new password for this employee, then give it to them."
      />
      <Row style={{ alignItems: "flex-end" }}>
        <Field
          containerStyle={{ flex: 1 }}
          label="New password (min 8 characters)"
          value={newPw}
          onChangeText={setNewPw}
          autoCapitalize="none"
        />
        <Button
          small
          variant="secondary"
          title="Generate"
          icon="sparkles-outline"
          style={{ marginBottom: 4 }}
          onPress={() => setNewPw(generatePassword())}
        />
      </Row>
      <Button
        variant="secondary"
        title="Set password"
        icon="key-outline"
        onPress={setPassword}
      />
      {pwDone ? (
        <View
          style={{
            backgroundColor: colors.navySoft,
            borderRadius: 10,
            padding: 14,
            gap: 4,
          }}
        >
          <Muted>
            Password updated. Give this to the employee (shown only now):
          </Muted>
          <Text
            selectable
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
              letterSpacing: 1,
            }}
          >
            {pwDone}
          </Text>
        </View>
      ) : null}
    </Card>
  ) : null;

  const progressCard = (
    <Card style={{ gap: 12 }}>
      <CardTitle title="Progress" />
      {p ? (
        <>
          <View style={{ gap: 2 }}>
            <KV label="Current level" value={p.current_level?.name ?? "-"} />
            <KV
              label="Next level"
              value={p.next_level ? p.next_level.name : "Highest level reached"}
            />
            {extras.map(([k, v]) => (
              <KV key={k} label={k.replace(/_/g, " ")} value={String(v)} />
            ))}
          </View>
          {p.next_level ? (
            <>
              <Badge
                text={
                  p.eligible ? "Eligible for promotion" : "Not eligible yet"
                }
                tone={p.eligible ? "good" : "warn"}
              />
              <Button
                title={`Promote to ${p.next_level.name}`}
                icon="trending-up"
                onPress={() => promote(false)}
              />
              {needForce ? (
                <Button
                  variant="secondary"
                  title="Not eligible - promote anyway"
                  onPress={() => promote(true)}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <Muted>No progress data.</Muted>
      )}
    </Card>
  );

  const addMilestoneCard = (
    <Card style={{ gap: 14 }}>
      <CardTitle
        title="Add milestone"
        subtitle="Record an achievement for this employee"
      />
      <Field label="Title" value={msTitle} onChangeText={setMsTitle} />
      <Field
        label="Description (optional)"
        value={msDesc}
        onChangeText={setMsDesc}
        multiline
      />
      <Button
        variant="secondary"
        title="Record milestone"
        icon="flag-outline"
        onPress={addMilestone}
      />
    </Card>
  );

  const milestonesCard = (
    <Card style={{ gap: 14 }}>
      <CardTitle title="Milestones" />
      {milestones.length === 0 ? <Muted>None yet.</Muted> : null}
      {milestones.map((m, i) => (
        <View key={String(m.id)} style={{ gap: 14 }}>
          {i > 0 ? <Divider /> : null}
          <Row style={{ alignItems: "flex-start", gap: 12 }}>
            <IconDot name="flag-outline" />
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
      <CardTitle title="History" />
      {history.length === 0 ? <Muted>None yet.</Muted> : null}
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
            <Muted>{h.created_at.slice(0, 10)}</Muted>
          </View>
        </View>
      ))}
    </Card>
  );

  const removeButton =
    !isSelf && profile ? (
      <Button
        variant="danger"
        small={wide}
        icon="person-remove-outline"
        title={
          confirmRemove
            ? "Tap again to confirm: deactivate and block login"
            : "Deactivate employee"
        }
        onPress={remove}
      />
    ) : null;

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <ErrorText>{error}</ErrorText>
      <Notice tone="good">{msg}</Notice>

      {headerCard}

      {wide ? (
        <View
          style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, gap: 16 }}>
            {detailsCard}
            {passwordCard}
          </View>
          <View style={{ flex: 1, gap: 16 }}>
            {progressCard}
            {addMilestoneCard}
            {milestonesCard}
            {historyCard}
          </View>
        </View>
      ) : (
        <>
          {detailsCard}
          {passwordCard}
          {progressCard}
          {addMilestoneCard}
          {milestonesCard}
          {historyCard}
        </>
      )}

      {removeButton}
    </Screen>
  );
}
