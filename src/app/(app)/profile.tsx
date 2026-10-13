import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button, Card, ErrorText, Muted, Screen, Title } from '@/components/ui';
import { colors } from '@/theme';

const inputStyle = {
  backgroundColor: colors.field,
  borderRadius: 10,
  padding: 12,
  color: colors.text,
} as const;

export default function Profile() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function changePassword() {
    setError(null);
    setSuccess(null);
    if (!current || !next) return setError('Fill in all fields.');
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('New passwords do not match.');
    if (next === current) return setError('New password must be different from the current one.');

    setBusy(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { current_password: current, new_password: next },
      });
      setSuccess('Password changed.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e: any) {
      setError(e?.message ?? 'Could not change password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Title>{user?.full_name || 'Profile'}</Title>
        <Muted>{user?.email}</Muted>
        <Muted>Role: {user?.role}</Muted>
        {user?.position ? <Muted>Position: {user.position}</Muted> : null}
        {user?.attendance_points !== undefined ? (
          <Muted>Attendance points: {user.attendance_points}</Muted>
        ) : null}
      </Card>

      <Card>
        <Text style={{ fontWeight: '800', color: colors.text }}>Change password</Text>
        <TextInput
          placeholder="Current password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          value={current}
          onChangeText={setCurrent}
          style={inputStyle}
        />
        <TextInput
          placeholder="New password (min 8 characters)"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          value={next}
          onChangeText={setNext}
          style={inputStyle}
        />
        <TextInput
          placeholder="Confirm new password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          value={confirm}
          onChangeText={setConfirm}
          style={inputStyle}
        />
        <ErrorText>{error}</ErrorText>
        {success ? <Text style={{ color: colors.success }}>{success}</Text> : null}
        <Button title="Update password" onPress={changePassword} loading={busy} />
      </Card>

      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}