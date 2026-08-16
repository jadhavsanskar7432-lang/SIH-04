import DashboardLayout from '../components/layout/DashboardLayout'
import { hospitalNavItems } from '../config/navConfig'

export default function HospitalLayout() {
  return (
    <DashboardLayout navItems={hospitalNavItems} basePath="/hospital" roleLabel="Hospital" />
  )
}