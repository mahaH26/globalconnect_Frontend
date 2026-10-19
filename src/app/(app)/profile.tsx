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
import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";

export default function Profile() {
  const auth = useAuth() as any;
  const { user, logout } = auth;
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  // ---- name ----
  const [name, setName] = useState(user?.full_name ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  // keep the field in sync if the user object changes elsewhere
  useEffect(() => {
    setName(user?.full_name ?? "");
  }, [user?.full_name]);

  const cleanName = name.trim().replace(/\s+/g, " ");
  const nameChanged = cleanName !== (user?.full_name ?? "");

  async function saveName() {
    setNameError(null);
    setNameSuccess(null);
    if (cleanName.length < 2)
      return setNameError("Name must be at least 2 characters.");
    if (cleanName.length > 60)
      return setNameError("Name must be 60 characters or fewer.");
    if (!nameChanged) return;

    setNameBusy(true);
    try {
      await api("/me", { method: "PATCH", body: { full_name: cleanName } });

      // Update the logged-in user everywhere (sidebar, header, avatar, lists...)
      if (typeof auth.refreshUser === "function") {
        await auth.refreshUser();
      } else if (typeof auth.setUser === "function") {
        auth.setUser({ ...user, full_name: cleanName });
      }

      setName(cleanName);
      setNameSuccess("Name updated.");
    } catch (e: any) {
      setNameError(e?.message ?? "Could not update name");
    } finally {
      setNameBusy(false);
    }
  }

  // ---- email (admin only) ----
  const isAdmin = user?.role === "admin";
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user?.email]);

  const cleanEmail = email.trim().toLowerCase();
  const emailChanged = cleanEmail !== (user?.email ?? "").toLowerCase();

  async function saveEmail() {
    setEmailError(null);
    setEmailSuccess(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return setEmailError("Enter a valid email address.");
    if (!emailChanged) return;

    setEmailBusy(true);
    try {
      await api("/me", { method: "PATCH", body: { email: cleanEmail } });
      if (typeof auth.refreshUser === "function") await auth.refreshUser();
      else if (typeof auth.setUser === "function")
        auth.setUser({ ...user, email: cleanEmail });
      setEmail(cleanEmail);
      setEmailSuccess("Email updated. Use it the next time you log in.");
    } catch (e: any) {
      setEmailError(e?.message ?? "Could not update email");
    } finally {
      setEmailBusy(false);
    }
  }

  // ---- password ----
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

  const nameCard = (
    <Card style={{ gap: 14 }}>
      <CardTitle
        title="Display name"
        subtitle="Shown to your team in chat, attendance and notifications."
      />
      <Field
        label="Full name"
        placeholder="Your full name"
        autoCapitalize="words"
        value={name}
        onChangeText={(t: string) => {
          setName(t);
          setNameSuccess(null);
        }}
        onSubmitEditing={saveName}
        maxLength={60}
      />
      <ErrorText>{nameError}</ErrorText>
      <Notice tone="good">{nameSuccess}</Notice>
      <Button
        title="Save name"
        icon="checkmark-outline"
        onPress={saveName}
        loading={nameBusy}
        disabled={!nameChanged || nameBusy}
      />
    </Card>
  );

  const emailCard = isAdmin ? (
    <Card style={{ gap: 14 }}>
      <CardTitle
        title="Email address"
        subtitle="Admin only. This is the email you use to log in."
      />
      <Field
        label="Email"
        placeholder="name@company.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={(t: string) => {
          setEmail(t);
          setEmailSuccess(null);
        }}
        onSubmitEditing={saveEmail}
      />
      <ErrorText>{emailError}</ErrorText>
      <Notice tone="good">{emailSuccess}</Notice>
      <Button
        title="Save email"
        icon="mail-outline"
        onPress={saveEmail}
        loading={emailBusy}
        disabled={!emailChanged || emailBusy}
      />
    </Card>
  ) : null;

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
        subtitle="Your account details, name and password"
      />
      {wide ? (
        <View
          style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, gap: 16 }}>
            {profileCard}
            {logoutButton}
          </View>
          <View style={{ flex: 1.4, gap: 16 }}>
            {nameCard}
            {emailCard}
            {passwordCard}
          </View>
        </View>
      ) : (
        <>
          {profileCard}
          {nameCard}
          {emailCard}
          {passwordCard}
          {logoutButton}
        </>
      )}
    </Screen>
  );
}
