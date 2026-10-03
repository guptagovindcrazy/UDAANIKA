import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportRescue from './pages/ReportRescue';
import MyRescues from './pages/MyRescues';
import RescueDetail from './pages/RescueDetail';
import Identify from './pages/Identify';
import Migration from './pages/Migration';
import Profile from './pages/Profile';
import VolunteerRegister from './pages/VolunteerRegister';
import VolunteerDashboard from './pages/VolunteerDashboard';
import VolunteerRescues from './pages/VolunteerRescues';
import VolunteerRescueDetail from './pages/VolunteerRescueDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminRescues from './pages/AdminRescues';
import AdminVolunteers from './pages/AdminVolunteers';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="identify" element={<Identify />} />
        <Route path="migration" element={<Migration />} />

        {/* any signed-in role */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="rescues/:id" element={<RescueDetail />} />
        </Route>

        <Route element={<ProtectedRoute roles={['user']} />}>
          <Route path="report-rescue" element={<ReportRescue />} />
          <Route path="my-rescues" element={<MyRescues />} />
        </Route>

        <Route element={<ProtectedRoute roles={['user', 'volunteer']} />}>
          <Route path="volunteer/register" element={<VolunteerRegister />} />
        </Route>

        <Route element={<ProtectedRoute roles={['volunteer']} />}>
          <Route path="volunteer" element={<VolunteerDashboard />} />
          <Route path="volunteer/rescues" element={<VolunteerRescues />} />
          <Route path="volunteer/rescues/:id" element={<VolunteerRescueDetail />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/rescues" element={<AdminRescues />} />
            <Route path="admin/volunteers" element={<AdminVolunteers />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
