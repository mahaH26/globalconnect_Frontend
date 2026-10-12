import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, useWindowDimensions } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Center } from '@/components/ui';
import { colors } from '@/theme';

const icon = (emoji: string) => () => <Text style={{ fontSize: 18 }}>{emoji}</Text>;

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  if (loading) return <Center><ActivityIndicator size="large" color={colors.primary} /></Center>;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarActiveTintColor: colors.primary,
        tabBarLabelPosition: wide ? 'below-icon' : undefined,
      }}
    >
      <Tabs.Screen name="index" options={{ title: user.role === 'admin' ? 'Dashboard' : 'Home', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
