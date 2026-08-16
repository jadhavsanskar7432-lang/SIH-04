import { Routes, Route } from 'react-router-dom'

import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import RootRedirect from './routes/RootRedirect'

import Login from './pages/auth/Login'
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'

import AdminLayout from './layouts/AdminLayout'
import HospitalLayout from './layouts/HospitalLayout'
import VendorLayout from './layouts/VendorLayout'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminInventory from './pages/admin/Inventory'
import AdminHospitals from './pages/admin/Hospitals'
import AdminVendors from './pages/admin/Vendors'
import AdminOrders from './pages/admin/Orders'
import AdminShipments from './pages/admin/Shipments'
import AdminAnalytics from './pages/admin/Analytics'
import AdminAlerts from './pages/admin/Alerts'

// Hospital pages
import HospitalDashboard from './pages/hospital/Dashboard'
import HospitalInventory from './pages/hospital/Inventory'
import HospitalConsumption from './pages/hospital/Consumption'
import HospitalOrders from './pages/hospital/Orders'
import HospitalShipments from './pages/hospital/Shipments'
import HospitalExpiry from './pages/hospital/Expiry'
import HospitalAlerts from './pages/hospital/Alerts'

// Vendor pages
import VendorDashboard from './pages/vendor/Dashboard'
import VendorOrders from './pages/vendor/Orders'
import VendorShipments from './pages/vendor/Shipments'
import VendorPerformance from './pages/vendor/Performance'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="hospitals" element={<AdminHospitals />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="shipments" element={<AdminShipments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="alerts" element={<AdminAlerts />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['hospital']} />}>
          <Route path="/hospital" element={<HospitalLayout />}>
            <Route index element={<HospitalDashboard />} />
            <Route path="inventory" element={<HospitalInventory />} />
            <Route path="consumption" element={<HospitalConsumption />} />
            <Route path="orders" element={<HospitalOrders />} />
            <Route path="shipments" element={<HospitalShipments />} />
            <Route path="expiry" element={<HospitalExpiry />} />
            <Route path="alerts" element={<HospitalAlerts />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['vendor']} />}>
          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<VendorDashboard />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="shipments" element={<VendorShipments />} />
            <Route path="performance" element={<VendorPerformance />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}