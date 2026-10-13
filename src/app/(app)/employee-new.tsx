import DateField from "@/components/DateField";
import {
  BackButton,
  Button,
  Card,
  Chips,
  ErrorText,
  Field,
  FieldRow,
  Muted,
  Row,
  Screen,
  Section,
  Title,
  chipOptions,
} from "@/components/ui";
import { api } from "@/lib/api";
import { generatePassword } from "@/lib/password";
import { colors } from "@/theme";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

interface Department {
  id: string;
  name: string;
}

const ROLES = ["employee", "admin"] as const;
const STATUSES = ["active", "probation"] as const;

const EMPTY = {
  email: "",
  password: "",
  full_name: "",
  position: "",
  phone: "",
};

export default function NewEmployeeScreen() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [joiningDate, setJoiningDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("employee");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("active");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(
    null,
  );

  useEffect(() => {
    api<{ departments: Department[] }>("/settings")
      .then((r) => setDepartments(r.departments ?? []))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setForm(EMPTY);
    setJoiningDate("");
    setLastDate("");
    setRole("employee");
    setStatus("active");
    setDepartmentId(null);
    setError(null);
    setCreated(null);
  };

  const submit = async () => {
    setError(null);
    if (!form.email.trim() || !form.full_name.trim() || form.password.length < 8) {
      setError("Email, full name and a password of at least 8 characters are required");
      return;
    }
    if (joiningDate && lastDate && lastDate < joiningDate) {
      setError("The last date can't be before the joining date");
      return;
    }
    setSaving(true);
    try {
      await api("/employees", {
        method: "POST",
        body: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          role,
          employment_status: status,
          ...(departmentId ? { department_id: departmentId } : {}),
          ...(form.position.trim() ? { position: form.position.trim() } : {}),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          ...(joiningDate ? { joining_date: joiningDate } : {}),
          ...(lastDate ? { last_working_date: lastDate } : {}),
        },
      });
      setCreated({
        name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
    } catch (e: any) {
      setError(e?.message ?? "Could not create employee");
    } finally {
      setSaving(false);
    }
  };

  // After creating: show the login details so the admin can hand them to the employee
  if (created) {
    return (
      <Screen>
        <Title>Employee created</Title>
        <Card style={{ gap: 10 }}>
          <Muted>
            Give these login details to {created.name}. The password is shown only now, but you can
            set a new one any time from the employee's page.
          </Muted>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>Email</Text>
          <Text selectable style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
            {created.email}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>Password</Text>
          <Text
            selectable
            style={{ fontSize: 20, fontWeight: "800", color: colors.text, letterSpacing: 1 }}
          >
            {created.password}
          </Text>
        </Card>
        <Button title="Add another employee" onPress={reset} />
        <Button variant="secondary" title="Back to employees" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <Title>Add employee</Title>
      <ErrorText>{error}</ErrorText>

      <Section title="Login" />
      <Field
        label="Email"
        value={form.email}
        onChangeText={set("email")}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Row style={{ alignItems: "flex-end" }}>
        <Field
          containerStyle={{ flex: 1 }}
          label="Password (min 8 characters)"
          value={form.password}
          onChangeText={set("password")}
          autoCapitalize="none"
        />
        <Button
          small
          variant="secondary"
          title="Generate"
          style={{ marginBottom: 2 }}
          onPress={() => setForm((f) => ({ ...f, password: generatePassword() }))}
        />
      </Row>
      <Muted>You will see the password again after saving, so you can give it to the employee.</Muted>

      <Section title="Profile" />
      <FieldRow>
        <Field half label="Full name" value={form.full_name} onChangeText={set("full_name")} />
        <Field half label="Position" value={form.position} onChangeText={set("position")} />
        <Field half label="Phone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
      </FieldRow>

      <Section title="Dates" />
      <FieldRow>
        <DateField half label="Joining date" value={joiningDate} onChange={setJoiningDate} />
        <DateField
          half
          label="Last working date (optional)"
          value={lastDate}
          onChange={setLastDate}
          minDate={joiningDate || undefined}
          placeholder="Not set"
        />
      </FieldRow>

      <Section title="Role and status" />
      <Chips label="Role" options={chipOptions(ROLES)} value={role} onChange={setRole} />
      <Chips label="Status" options={chipOptions(STATUSES)} value={status} onChange={setStatus} />
      <Chips
        label="Department"
        options={[
          { value: "", label: "No department" },
          ...departments.map((d) => ({ value: d.id, label: d.name })),
        ]}
        value={departmentId ?? ""}
        onChange={(v) => setDepartmentId(v || null)}
      />

      <Button title="Create employee" onPress={submit} loading={saving} />
    </Screen>
  );
}