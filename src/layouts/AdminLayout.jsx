import DashboardLayout from '../components/layout/DashboardLayout'
import { adminNavItems } from '../config/navConfig'

export default function AdminLayout() {
  return (
    <DashboardLayout navItems={adminNavItems} basePath="/admin" roleLabel="Admin" />
  )
}