import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { NewBooking } from './pages/NewBooking';
import { MyBookings, MyBookingDetail } from './pages/MyBookings';
import { AdminRequests } from './pages/AdminRequests';
import { AdminBookingDetail } from './pages/AdminBookingDetail';
import { AdminEquipment } from './pages/AdminEquipment';
import './styles/app.css';

function RoleRoutes() {
  const { role, mode } = useParams();
  if ((role !== 'admin' && role !== 'activist') || (mode !== 'miniapp' && mode !== 'desktop')) return <Navigate to="/" replace />;
  return <Layout />;
}

function RoleIndex() {
  const { role, mode } = useParams();
  return <Navigate to={`/${mode}/${role}/${role === 'admin' ? 'requests' : 'catalog'}`} replace />;
}

createRoot(document.getElementById('root')!).render(<HashRouter><Routes>
  <Route path="/" element={<Home />}/>
  <Route path="/:mode/:role" element={<RoleRoutes />}>
    <Route index element={<RoleIndex />}/>
    <Route path="catalog" element={<Catalog />}/>
    <Route path="new" element={<NewBooking />}/>
    <Route path="bookings" element={<MyBookings />}/>
    <Route path="bookings/:id" element={<MyBookingDetail />}/>
    <Route path="requests" element={<AdminRequests />}/>
    <Route path="requests/:id" element={<AdminBookingDetail />}/>
    <Route path="equipment" element={<AdminEquipment />}/>
  </Route>
  <Route path="*" element={<Navigate to="/" replace />}/>
</Routes></HashRouter>);
