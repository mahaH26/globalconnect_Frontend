import { useAuth } from '@/context/AuthContext';
import AdminHome from '@/components/AdminHome';
import EmployeeHome from '@/components/EmployeeHome';

export default function Home() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminHome /> : <EmployeeHome />;
}
