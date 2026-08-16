import DashboardLayout from '../components/layout/DashboardLayout'
import { vendorNavItems } from '../config/navConfig'

export default function VendorLayout() {
  return (
    <DashboardLayout navItems={vendorNavItems} basePath="/vendor" roleLabel="Vendor" />
  )
}