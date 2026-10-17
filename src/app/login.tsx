import { Button, Center, ErrorText, Field } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, View } from "react-native";

const LOGO = require("../../assets/logo/logo.png");

export default function Login() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) return <Redirect href="/" />;

  async function submit() {
    if (!email || !password) return setError("Enter your email and password");
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Center>
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: 400 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 24,
              gap: 16,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <Image
                source={LOGO}
                resizeMode="contain"
                style={{ width: 280, height: 100 }}
              />
            </View>

            <Field
              label="Email"
              placeholder="name@company.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Password"
              placeholder="Your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
            />
            <ErrorText>{error}</ErrorText>
            <Button
              title="Log in"
              icon="log-in-outline"
              onPress={submit}
              loading={busy}
            />
          </View>
        </View>
      </ScrollView>
    </Center>
  );
}
