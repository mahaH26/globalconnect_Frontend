import { api } from "@/lib/api";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Department {
  id: string;
  name: string;
}

export default function NewEmployeeScreen() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    position: "",
    phone: "",
    joining_date: "",
  });
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const [status, setStatus] = useState<"active" | "probation">("active");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ departments: Department[] }>("/settings")
      .then((r) => setDepartments(r.departments ?? []))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.email.trim() || !form.full_name.trim() || form.password.length < 8) {
      setError("Email, full name and a password of at least 8 characters are required");
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
          ...(form.joining_date.trim()
            ? { joining_date: form.joining_date.trim() }
            : {}),
        },
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Could not create employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()}>
        <Text>{"< Back"}</Text>
      </TouchableOpacity>
      <Text>Add employee</Text>

      <TextInput placeholder="Full name" value={form.full_name} onChangeText={set("full_name")} />
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={set("email")}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password (min 8 characters)"
        value={form.password}
        onChangeText={set("password")}
        autoCapitalize="none"
      />
      <TextInput placeholder="Position" value={form.position} onChangeText={set("position")} />
      <TextInput placeholder="Phone" value={form.phone} onChangeText={set("phone")} />
      <TextInput
        placeholder="Joining date (YYYY-MM-DD)"
        value={form.joining_date}
        onChangeText={set("joining_date")}
        autoCapitalize="none"
      />

      <Text>Role</Text>
      {(["employee", "admin"] as const).map((r) => (
        <TouchableOpacity key={r} onPress={() => setRole(r)}>
          <Text>
            {role === r ? "● " : "○ "}
            {r}
          </Text>
        </TouchableOpacity>
      ))}

      <Text>Status</Text>
      {(["active", "probation"] as const).map((s) => (
        <TouchableOpacity key={s} onPress={() => setStatus(s)}>
          <Text>
            {status === s ? "● " : "○ "}
            {s}
          </Text>
        </TouchableOpacity>
      ))}

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

      {error && <Text>{error}</Text>}
      <TouchableOpacity onPress={submit} disabled={saving}>
        <Text>{saving ? "Creating..." : "Create employee"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}