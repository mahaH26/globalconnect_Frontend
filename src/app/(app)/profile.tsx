import { useAuth } from '@/context/AuthContext';
import { Button, Card, Muted, Screen, Title } from '@/components/ui';

export default function Profile() {
  const { user, logout } = useAuth();
  return (
    <Screen>
      <Card>
        <Title>{user?.full_name || 'Profile'}</Title>
        <Muted>{user?.email}</Muted>
        <Muted>Role: {user?.role}</Muted>
        {user?.position ? <Muted>Position: {user.position}</Muted> : null}
        {user?.attendance_points !== undefined ? <Muted>Attendance points: {user.attendance_points}</Muted> : null}
      </Card>
      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}
