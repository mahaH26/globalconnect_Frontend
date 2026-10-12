import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext"; // Add this import
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </NotificationProvider>
    </AuthProvider>
  );
}
