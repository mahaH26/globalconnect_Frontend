import {
  BrandBackdrop,
  FEATURES,
  LoginForm,
  Logo,
  useReady,
} from "@/components/AuthShared";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function FeaturesContent({
  count,
  twoColumns,
  large,
}: {
  count: number;
  twoColumns: boolean;
  large: boolean;
}) {
  return (
    <View style={{ gap: large ? 20 : 28 }}>
      <View style={{ gap: 12, maxWidth: 560 }}>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: large ? 34 : 26,
            fontWeight: "700",
            lineHeight: large ? 40 : 32,
          }}
        >
          Your people workspace,{"\n"}all in one place
          <Text style={{ color: colors.primary }}>.</Text>
        </Text>
        <Text style={{ color: "#C9CDE8", fontSize: 15, lineHeight: 22 }}>
          Attendance, locations, leave, reports and team chat for every employee
          and administrator at Global Connect.
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
        {FEATURES.slice(0, count).map((f) => (
          <View
            key={f.title}
            style={{
              width: twoColumns ? "50%" : "100%",
              paddingRight: 16,
              paddingVertical: large ? 7 : 10,
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
              <Text style={{ color: "#C9CDE8", fontSize: 13, lineHeight: 18 }}>
                {f.text}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [showFeatures, setShowFeatures] = useState(false);
  const split = width >= 900;
  const phone = width < 640;
  const ready = useReady();

  if (!loading && user) return <Redirect href="/" />;
  if (!ready) return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />;

  const form = (
    <View style={{ width: "100%", maxWidth: 400, gap: phone ? 24 : 32 }}>
      <Logo width={phone ? 180 : 220} height={phone ? 64 : 80} />
      <LoginForm
        heading="Log in to your account"
        subheading="Use the email and password given to you by your administrator."
      />
      {split ? null : (
        <Pressable
          onPress={() => setShowFeatures(true)}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}
          >
            View features
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </Pressable>
      )}
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
        <View
          style={{
            flex: 1.4,
            backgroundColor: colors.navy,
            overflow: "hidden",
          }}
        >
          <BrandBackdrop />
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: 64,
              paddingVertical: 28,
            }}
          >
            <FeaturesContent count={FEATURES.length} twoColumns large />
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: phone ? 20 : 32,
          paddingVertical: 40,
          alignItems: phone ? "stretch" : "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {form}
      </ScrollView>

      <Modal
        visible={showFeatures}
        animationType="slide"
        onRequestClose={() => setShowFeatures(false)}
      >
        <View
          style={{ flex: 1, backgroundColor: colors.navy, overflow: "hidden" }}
        >
          <BrandBackdrop />
          <ScrollView
            contentContainerStyle={{
              padding: phone ? 20 : 32,
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 32,
              gap: 24,
            }}
          >
            <View style={{ alignItems: "flex-end" }}>
              <Pressable
                onPress={() => setShowFeatures(false)}
                accessibilityLabel="Close"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
            <FeaturesContent
              count={FEATURES.length}
              twoColumns={width >= 640}
              large={false}
            />
            <Pressable
              onPress={() => setShowFeatures(false)}
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 18,
                paddingVertical: 12,
              }}
            >
              <Ionicons name="log-in-outline" size={17} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>
                Back to log in
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}