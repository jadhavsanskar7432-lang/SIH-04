import { Package, ClipboardList, ShoppingCart, CalendarClock } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

export default function HospitalDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your hospital's supply status" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Stock Items" value="312" icon={Package} accent="indigo" />
        <StatCard label="Monthly Consumption" value="1,024" icon={ClipboardList} accent="emerald" />
        <StatCard label="Pending Orders" value="9" icon={ShoppingCart} accent="amber" />
        <StatCard label="Expiring Soon" value="14" icon={CalendarClock} accent="rose" />
      </div>
    </div>
  )
}