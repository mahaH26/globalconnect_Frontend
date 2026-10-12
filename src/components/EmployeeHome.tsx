import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Text } from 'react-native';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, ErrorText, Muted, Screen, Stat, StatGrid, Title } from '@/components/ui';
import { colors } from '@/theme';

interface Attendance {
  check_in: string | null;
  check_out: string | null;
  status: string;
  overtime_minutes: number;
  early_checkout: boolean;
}
interface Summary {
  month: string;
  present: number;
  late: number;
  absent: number;
  attendance_rate: number | null;
  total_points: number;
  overtime_minutes: number;
}

const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bahrain' }) : '--:--';

export default function EmployeeHome() {
  const { user } = useAuth();
  const [today, setToday] = useState<Attendance | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [t, s] = await Promise.all([
        api<Attendance | null>('/attendance/today'),
        api<Summary>('/attendance/me/summary'),
      ]);
      setToday(t);
      setSummary(s);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function punch(kind: 'check-in' | 'check-out') {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') throw new Error('Location permission is required to check in.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await api(`/attendance/${kind}`, {
        method: 'POST',
        body: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      });
      setMessage(kind === 'check-in' ? 'Checked in successfully.' : 'Checked out successfully.');
      await load();
    } catch (e: any) {
      if (e instanceof ApiError && e.data?.distance_m !== undefined) {
        setError(`${e.message} (you are ${e.data.distance_m} m away).`);
      } else {
        setError(e.message ?? 'Something went wrong');
      }
    } finally {
      setBusy(false);
    }
  }

  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title>Hello, {user?.full_name?.split(' ')[0] || 'there'}</Title>

      <Card>
        <Muted>Today</Muted>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
          {!checkedIn ? 'Not checked in' : checkedOut ? 'Day complete' : 'Checked in'}
        </Text>
        {checkedIn ? (
          <Muted>
            In: {time(today!.check_in)} {today!.status === 'late' ? '(late)' : ''}   Out: {time(today!.check_out)}
          </Muted>
        ) : null}
        {!checkedOut ? (
          <Button
            title={checkedIn ? 'Check out' : 'Check in'}
            onPress={() => punch(checkedIn ? 'check-out' : 'check-in')}
            loading={busy}
          />
        ) : null}
        <ErrorText>{error}</ErrorText>
        {message ? <Text style={{ color: colors.success }}>{message}</Text> : null}
      </Card>

      {summary ? (
        <>
          <Muted>This month ({summary.month})</Muted>
          <StatGrid>
            <Stat label="Attendance" value={summary.attendance_rate === null ? '-' : `${summary.attendance_rate}%`} tone="good" />
            <Stat label="Present" value={summary.present} />
            <Stat label="Late" value={summary.late} tone="warn" />
            <Stat label="Absent" value={summary.absent} tone="bad" />
            <Stat label="Points" value={summary.total_points} />
          </StatGrid>
        </>
      ) : null}
    </Screen>
  );
}
