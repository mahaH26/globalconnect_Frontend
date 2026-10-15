import {
  Avatar,
  Badge,
  Button,
  Card,
  CardTitle,
  Divider,
  ErrorText,
  Field,
  KV,
  Muted,
  Notice,
  PageHeader,
  Row,
  Screen,
  Title,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useState } from "react";
import { View, useWindowDimensions } from "react-native";

export default function Profile() {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function changePassword() {
    setError(null);
    setSuccess(null);
    if (!current || !next) return setError("Fill in all fields.");
    if (next.length < 8)
      return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords do not match.");
    if (next === current)
      return setError("New password must be different from the current one.");

    setBusy(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { current_password: current, new_password: next },
      });
      setSuccess("Password changed.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: any) {
      setError(e?.message ?? "Could not change password");
    } finally {
      setBusy(false);
    }
  }

  const profileCard = (
    <Card style={{ gap: 14 }}>
      <Row style={{ gap: 14 }}>
        <Avatar name={user?.full_name} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <Title>{user?.full_name || "Profile"}</Title>
          <Muted>{user?.email}</Muted>
        </View>
      </Row>
      <Divider />
      <View style={{ gap: 2 }}>
        <KV
          label="Role"
          value={<Badge text={user?.role ?? "-"} tone="info" />}
        />
        {user?.position ? <KV label="Position" value={user.position} /> : null}
        {user?.attendance_points !== undefined ? (
          <KV label="Attendance points" value={user.attendance_points} />
        ) : null}
      </View>
    </Card>
  );

  const passwordCard = (
    <Card style={{ gap: 14 }}>
      <CardTitle
        title="Change password"
        subtitle="Use at least 8 characters."
      />
      <Field
        label="Current password"
        placeholder="Current password"
        secureTextEntry
        autoCapitalize="none"
        value={current}
        onChangeText={setCurrent}
      />
      <Field
        label="New password"
        placeholder="Min 8 characters"
        secureTextEntry
        autoCapitalize="none"
        value={next}
        onChangeText={setNext}
      />
      <Field
        label="Confirm new password"
        placeholder="Repeat the new password"
        secureTextEntry
        autoCapitalize="none"
        value={confirm}
        onChangeText={setConfirm}
      />
      <ErrorText>{error}</ErrorText>
      <Notice tone="good">{success}</Notice>
      <Button title="Update password" onPress={changePassword} loading={busy} />
    </Card>
  );

  const logoutButton = (
    <Button
      title="Log out"
      variant="danger"
      icon="log-out-outline"
      onPress={logout}
      small={wide}
    />
  );

  return (
    <Screen>
      <PageHeader
        title="Profile"
        subtitle="Your account details and password"
      />
      {wide ? (
        <View
          style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, gap: 16 }}>
            {profileCard}
            {logoutButton}
          </View>
          <View style={{ flex: 1.4 }}>{passwordCard}</View>
        </View>
      ) : (
        <>
          {profileCard}
          {passwordCard}
          {logoutButton}
        </>
      )}
    </Screen>
  );
}
