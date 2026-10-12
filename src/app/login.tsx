import { useState } from 'react';
import { Redirect } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Button, Center, ErrorText, Muted } from '@/components/ui';
import { colors } from '@/theme';

export default function Login() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) return <Redirect href="/" />;

  async function submit() {
    if (!email || !password) return setError('Enter your email and password');
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Center>
      <View style={styles.box}>
        <Text style={styles.brand}>Global Connect</Text>
        <Muted>Employee Portal</Muted>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />
        <ErrorText>{error}</ErrorText>
        <Button title="Log in" onPress={submit} loading={busy} />
      </View>
    </Center>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', maxWidth: 380, padding: 24, gap: 12 },
  brand: { fontSize: 28, fontWeight: '800', color: colors.text },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text,
  },
});
