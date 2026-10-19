import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { colors } from "@/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        {/* Off-white base so nothing flashes white between screens. */}
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Dark icons on the light background. */}
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              // Fade instead of the default slide — quieter, less "default app".
              animation: "fade",
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </View>
      </NotificationProvider>
    </AuthProvider>
  );
}
