import { BrandBackdrop, useReady } from "@/components/AuthShared";
import { Button } from "@/components/ui";
import { colors } from "@/theme";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

const LOGO = require("../../assets/logo/logo.png");

export default function NotFound() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const phone = width < 640;
  const ready = useReady();

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.navy }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, overflow: "hidden" }}>
      <BrandBackdrop />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: phone ? 24 : 48,
          gap: phone ? 16 : 20,
        }}
      >
        <Image
          source={LOGO}
          resizeMode="contain"
          style={{
            width: phone ? 180 : 220,
            height: phone ? 64 : 80,
            marginBottom: phone ? 12 : 20,
          }}
        />

        <Text
          style={{
            color: colors.primary,
            fontSize: phone ? 88 : 128,
            fontWeight: "800",
            lineHeight: phone ? 96 : 136,
            letterSpacing: 2,
          }}
        >
          404
        </Text>

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: phone ? 26 : 34,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Page not found
        </Text>

        <Text
          style={{
            color: "#C9CDE8",
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            maxWidth: 420,
          }}
        >
          The page you are looking for doesn't exist or may have been moved.
        </Text>

        <View
          style={{
            flexDirection: phone ? "column" : "row",
            alignSelf: phone ? "stretch" : "center",
            gap: 12,
            marginTop: 12,
          }}
        >
          <Button
            title="Go to home"
            icon="home-outline"
            onPress={() => router.replace("/" as any)}
            style={phone ? undefined : { minWidth: 180 }}
          />
          <Button
            variant="secondary"
            title="Go back"
            icon="arrow-back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/" as any)
            }
            style={phone ? undefined : { minWidth: 180 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
