import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '@/lib/api';
import { Card, ErrorText, Muted, Screen, Stat, StatGrid, Title } from '@/components/ui';
import { colors } from '@/theme';

interface Dashboard {
  date: string;
  is_workday: boolean;
  total_employees: number;
  present: number;
  late: number;
  on_leave: number;
  not_checked_in: number;
  absent: number;
  attendance_rate: number | null;
  alerts: {
    pending_leave_requests: number;
    missing_checkout: number;
    unread_notifications: { id: string; title: string; body: string | null }[];
  };
}

export default function AdminHome() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api<Dashboard>('/dashboard'));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title>Dashboard</Title>
      <ErrorText>{error}</ErrorText>
      {data ? (
        <>
          <Muted>{data.date}{data.is_workday ? '' : ' (weekend)'}</Muted>
          <StatGrid>
            <Stat label="Employees" value={data.total_employees} />
            <Stat label="Present" value={data.present} tone="good" />
            <Stat label="Late" value={data.late} tone="warn" />
            <Stat label="On leave" value={data.on_leave} />
            <Stat label="Absent" value={data.absent} tone="bad" />
            <Stat label="Attendance" value={data.attendance_rate === null ? '-' : `${data.attendance_rate}%`} tone="good" />
          </StatGrid>

          <Card>
            <Title>Alerts</Title>
            <Text style={{ color: colors.text }}>Pending leave requests: {data.alerts.pending_leave_requests}</Text>
            <Text style={{ color: colors.text }}>Missing check-outs: {data.alerts.missing_checkout}</Text>
            {data.alerts.unread_notifications.map((n) => (
              <Text key={n.id} style={{ color: colors.muted }}>• {n.title}{n.body ? `: ${n.body}` : ''}</Text>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
