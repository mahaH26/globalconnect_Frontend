import CalendarPicker from "@/components/CalendarPicker";
import {
  BackButton,
  Button,
  Card,
  CardTitle,
  Chips,
  Divider,
  ErrorText,
  Field,
  FieldRow,
  Muted,
  PageHeader,
  Row,
  Screen,
  chipOptions,
} from "@/components/ui";
import { api } from "@/lib/api";
import { generatePassword } from "@/lib/password";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";

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

/** Label + calendar button, sized like a Field so it sits in a FieldRow */
function DateInput({
  label,
  value,
  onChange,
  minDate,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minDate?: string;
  emptyLabel: string;
}) {
  return (
    <View style={{ gap: 6, flexGrow: 1, flexBasis: 240, minWidth: 0 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#5B6385" }}>
        {label}
      </Text>
      <CalendarPicker
        value={value}
        onChange={onChange}
        allowClear
        minDate={minDate}
        emptyLabel={emptyLabel}
      />
    </View>
  );
}

export default function NewEmployeeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [joiningDate, setJoiningDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("employee");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("active");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    api<{ departments: Department[] }>("/settings")
      .then((r) => setDepartments(r.departments ?? []))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
    if (
      !form.email.trim() ||
      !form.full_name.trim() ||
      form.password.length < 8
    ) {
      setError(
        "Email, full name and a password of at least 8 characters are required",
      );
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
        <View
          style={{ width: "100%", maxWidth: 560, alignSelf: "center", gap: 16 }}
        >
          <Card style={{ gap: 16, alignItems: "stretch" }}>
            <View style={{ alignItems: "center", gap: 10, paddingVertical: 4 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.successSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="checkmark" size={26} color={colors.success} />
              </View>
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: colors.text }}
              >
                Employee created
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Give these login details to {created.name}. The password is
                shown only now, but you can set a new one any time from the
                employee's page.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.navySoft,
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ gap: 2 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Email
                </Text>
                <Text
                  selectable
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {created.email}
                </Text>
              </View>
              <Divider />
              <View style={{ gap: 2 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Password
                </Text>
                <Text
                  selectable
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                    letterSpacing: 1,
                  }}
                >
                  {created.password}
                </Text>
              </View>
            </View>

            <Row style={{ gap: 8, flexWrap: "wrap" }}>
              <Button
                small
                icon="person-add-outline"
                title="Add another"
                onPress={reset}
              />
              <Button
                small
                variant="secondary"
                icon="arrow-back"
                title="Back to employees"
                onPress={() => router.back()}
              />
            </Row>
          </Card>
        </View>
      </Screen>
    );
  }

  const loginCard = (
    <Card style={{ gap: 16 }}>
      <CardTitle title="Login" subtitle="How this employee signs in" />
      <Field
        label="Email"
        placeholder="name@company.com"
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
          icon="sparkles-outline"
          title="Generate"
          style={{ marginBottom: 4 }}
          onPress={() =>
            setForm((f) => ({ ...f, password: generatePassword() }))
          }
        />
      </Row>
      <Muted>
        You'll see the password again after saving, so you can give it to the
        employee.
      </Muted>
    </Card>
  );

  const profileCard = (
    <Card style={{ gap: 16 }}>
      <CardTitle title="Profile" />
      <FieldRow>
        <Field
          half
          label="Full name"
          value={form.full_name}
          onChangeText={set("full_name")}
        />
        <Field
          half
          label="Position"
          value={form.position}
          onChangeText={set("position")}
        />
        <Field
          half
          label="Phone"
          value={form.phone}
          onChangeText={set("phone")}
          keyboardType="phone-pad"
        />
      </FieldRow>
    </Card>
  );

  const datesCard = (
    <Card style={{ gap: 16 }}>
      <CardTitle title="Dates" />
      <FieldRow>
        <DateInput
          label="Joining date"
          value={joiningDate}
          onChange={setJoiningDate}
          emptyLabel="Pick a date"
        />
        <DateInput
          label="Last working date (optional)"
          value={lastDate}
          onChange={setLastDate}
          minDate={joiningDate || undefined}
          emptyLabel="Not set"
        />
      </FieldRow>
    </Card>
  );

  const roleCard = (
    <Card style={{ gap: 16 }}>
      <CardTitle title="Role and status" />
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
      <Chips
        label="Department"
        options={[
          { value: "", label: "No department" },
          ...departments.map((d) => ({ value: d.id, label: d.name })),
        ]}
        value={departmentId ?? ""}
        onChange={(v) => setDepartmentId(v || null)}
      />
    </Card>
  );

  const createButton = (
    <Button
      title="Create employee"
      icon="person-add-outline"
      onPress={submit}
      loading={saving}
      style={wide ? { alignSelf: "flex-start", minWidth: 220 } : undefined}
    />
  );

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <PageHeader
        title="Add employee"
        subtitle="Create a login and profile for a new team member"
      />
      <ErrorText>{error}</ErrorText>

      {wide ? (
        <View
          style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, gap: 16 }}>
            {loginCard}
            {profileCard}
          </View>
          <View style={{ flex: 1, gap: 16 }}>
            {datesCard}
            {roleCard}
          </View>
        </View>
      ) : (
        <>
          {loginCard}
          {profileCard}
          {datesCard}
          {roleCard}
        </>
      )}

      {createButton}
    </Screen>
  );
}
