import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  return (
    <div className="container section admin">
      <Sidebar />
      <div className="admin__content"><Outlet /></div>
    </div>
  );
}
