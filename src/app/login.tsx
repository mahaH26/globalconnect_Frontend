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

export default function Login() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const split = width >= 900;
  const phone = width < 640;

  if (!loading && user) return <Redirect href="/" />;

  const form = (
    <View style={{ width: "100%", maxWidth: 400, gap: phone ? 24 : 32 }}>
      <Logo width={phone ? 180 : 220} height={phone ? 64 : 80} />
      <LoginForm
        heading="Log in to your account"
        subheading="Use the email and password given to you by your administrator."
      />
    </View>
  );

  const panel = (
    <View
      style={{
        flex: split ? 1.4 : undefined,
        backgroundColor: colors.navy,
        overflow: "hidden",
      }}
    >
      <BrandBackdrop />
      <View
        style={{
          flex: split ? 1 : undefined,
          padding: split ? 64 : phone ? 20 : 28,
          paddingVertical: split ? 64 : 32,
          justifyContent: "center",
          gap: 28,
        }}
      >
        <View style={{ gap: 12, maxWidth: 560 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: split ? 38 : phone ? 24 : 28,
              fontWeight: "700",
              lineHeight: split ? 46 : phone ? 30 : 34,
            }}
          >
            Your people workspace,{"\n"}all in one place
            <Text style={{ color: colors.primary }}>.</Text>
          </Text>
          <Text style={{ color: "#C9CDE8", fontSize: 15, lineHeight: 22 }}>
            Attendance, locations, leave, reports and team chat for every
            employee and administrator at Global Connect.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            maxWidth: 640,
            marginRight: -16,
          }}
        >
          {FEATURES.slice(0, 6).map((f) => (
            <View
              key={f.title}
              style={{
                width: width >= 640 ? "50%" : "100%",
                paddingRight: 16,
                paddingVertical: 10,
                flexDirection: "row",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(230,0,76,0.22)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={f.icon} size={18} color="#FF7AA2" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}
                >
                  {f.title}
                </Text>
                <Text
                  style={{ color: "#C9CDE8", fontSize: 13, lineHeight: 18 }}
                >
                  {f.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  if (split) {
    return (
      <View
        style={{ flex: 1, flexDirection: "row", backgroundColor: "#FFFFFF" }}
      >
        <ScrollView
          style={{ flexGrow: 1, flexBasis: 0, minWidth: 420, maxWidth: 560 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 56,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {form}
        </ScrollView>
        {panel}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          padding: phone ? 20 : 24,
          paddingTop: phone ? 36 : 48,
          paddingBottom: phone ? 32 : 40,
          alignItems: phone ? "stretch" : "center",
        }}
      >
        {form}
      </View>
      {panel}
    </ScrollView>
  );
}
