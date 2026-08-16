import { Package, Building2, ShoppingCart, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

export default function AdminDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of the entire supply chain network" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Inventory Items" value="1,284" icon={Package} accent="indigo" />
        <StatCard label="Connected Hospitals" value="42" icon={Building2} accent="emerald" />
        <StatCard label="Active Orders" value="87" icon={ShoppingCart} accent="amber" />
        <StatCard label="Open Alerts" value="5" icon={AlertTriangle} accent="rose" />
      </div>
    </div>
  )
}