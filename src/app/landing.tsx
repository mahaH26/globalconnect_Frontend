import {
  BrandBackdrop,
  FEATURES,
  LoginForm,
  Logo,
} from "@/components/AuthShared";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";

const SOFT = "#5B6385";

export default function Landing() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const split = width >= 1000;
  const phone = width < 640;
  const cols = phone ? 1 : 2;

  if (!loading && user) return <Redirect href="/" />;

  const hero = (
    <View style={{ gap: 18 }}>
      <Logo width={phone ? 180 : 230} height={phone ? 64 : 84} />
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: colors.accentSoft,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 5,
        }}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1,
          }}
        >
          PEOPLE WORKSPACE
        </Text>
      </View>
      <Text
        style={{
          color: colors.navy,
          fontSize: split ? 42 : phone ? 26 : 32,
          fontWeight: "700",
          lineHeight: split ? 50 : phone ? 32 : 38,
        }}
      >
        Attendance, leave and growth, managed in one place
        <Text style={{ color: colors.primary }}>.</Text>
      </Text>
      <Text
        style={{
          color: SOFT,
          fontSize: phone ? 15 : 16,
          lineHeight: phone ? 22 : 24,
          maxWidth: 620,
        }}
      >
        Global Connect gives your team a simple way to check in, request leave,
        stay in touch and track progress, while administrators get live
        visibility and ready-made reports.
      </Text>
    </View>
  );

  const features = (
    <View style={{ gap: 14 }}>
      <Text style={{ color: colors.navy, fontSize: 18, fontWeight: "700" }}>
        Key features
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -7 }}>
        {FEATURES.map((f) => (
          <View key={f.title} style={{ width: `${100 / cols}%`, padding: 7 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 18,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={f.icon} size={19} color={colors.primary} />
              </View>
              <Text
                style={{ color: colors.navy, fontWeight: "700", fontSize: 15 }}
              >
                {f.title}
              </Text>
              <Text style={{ color: SOFT, fontSize: 13, lineHeight: 19 }}>
                {f.text}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const note = (
    <Text style={{ color: colors.muted, fontSize: 13 }}>
      Accounts are created by your administrator. Ask them if you need access.
    </Text>
  );

  const card = (
    <View
      style={{
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: phone ? 20 : 28,
      }}
    >
      <LoginForm
        heading="Log in to your account"
        subheading="Use the email and password from your administrator."
      />
    </View>
  );

  if (split) {
    return (
      <View
        style={{ flex: 1, flexDirection: "row", backgroundColor: colors.bg }}
      >
        <ScrollView
          style={{ flex: 1.5 }}
          contentContainerStyle={{ padding: 56, gap: 36, maxWidth: 900 }}
        >
          {hero}
          {features}
          {note}
        </ScrollView>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.navy,
            overflow: "hidden",
          }}
        >
          <BrandBackdrop />
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {card}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: phone ? 16 : 24,
        paddingTop: phone ? 32 : 40,
        paddingBottom: 40,
        gap: phone ? 24 : 28,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {hero}
      <View
        style={{
          backgroundColor: colors.navy,
          borderRadius: 20,
          padding: phone ? 10 : 16,
          overflow: "hidden",
          alignItems: "center",
        }}
      >
        <BrandBackdrop />
        {card}
      </View>
      {features}
      {note}
    </ScrollView>
  );
}
