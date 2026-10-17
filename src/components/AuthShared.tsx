import { Button, ErrorText, Field } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

const LOGO = require("../../assets/logo/logo.png");

const SOFT = "#5B6385";

export function useReady() {
  const [mounted, setMounted] = useState(false);
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted && (fontsLoaded || !!fontError);
}

export const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "location-outline",
    title: "GPS attendance",
    text: "Check in and out from the office with automatic location verification.",
  },
  {
    icon: "map-outline",
    title: "Live employee locations",
    text: "See on a map where every check-in happened and how far from the office.",
  },
  {
    icon: "calendar-outline",
    title: "Attendance tracking",
    text: "On-time, late, absent, early checkouts and overtime, all calculated for you.",
  },
  {
    icon: "document-text-outline",
    title: "PDF and Excel reports",
    text: "Generate attendance, late, absence, overtime and progression reports in one click.",
  },
  {
    icon: "trending-up-outline",
    title: "Progress and promotions",
    text: "Attendance points, levels, milestones and promotion eligibility.",
  },
  {
    icon: "people-outline",
    title: "Multiple employees",
    text: "Manage staff, roles, departments and office locations in one place.",
  },
  {
    icon: "sunny-outline",
    title: "Leave management",
    text: "Request, review and approve leave, with alerts when teammates overlap.",
  },
  {
    icon: "chatbubble-outline",
    title: "Team chat",
    text: "Direct messages and group conversations across your company.",
  },
  {
    icon: "stats-chart-outline",
    title: "Personal insights",
    text: "Monthly attendance, punctuality and overtime trends for every employee.",
  },
  {
    icon: "notifications-outline",
    title: "Instant notifications",
    text: "Late arrivals, location issues and leave updates sent to the right people.",
  },
];

export function Logo({
  width = 200,
  height = 72,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <Image
      source={LOGO}
      resizeMode="contain"
      style={{ width, height, alignSelf: "flex-start" }}
    />
  );
}

export function BrandBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: "absolute",
          top: -160,
          right: -140,
          width: 460,
          height: 460,
          borderRadius: 230,
          backgroundColor: "rgba(230,0,76,0.22)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 40,
          right: 20,
          width: 220,
          height: 220,
          borderRadius: 110,
          borderWidth: 36,
          borderColor: "rgba(255,255,255,0.05)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -140,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "rgba(230,0,76,0.12)",
        }}
      />
    </View>
  );
}

export function LoginForm({
  heading,
  subheading,
}: {
  heading: string;
  subheading?: string;
}) {
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const phone = width < 640;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text
          style={{
            color: colors.navy,
            fontSize: phone ? 26 : 30,
            fontWeight: "700",
            lineHeight: phone ? 32 : 36,
          }}
        >
          {heading}
        </Text>
        {subheading ? (
          <Text style={{ color: SOFT, fontSize: 14, lineHeight: 20 }}>
            {subheading}
          </Text>
        ) : null}
      </View>

      <Field
        label="Email address"
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
  );
}
