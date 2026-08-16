import { ShoppingCart, Truck, CheckCircle2, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

export default function VendorDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your orders and deliveries" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Orders" value="23" icon={ShoppingCart} accent="indigo" />
        <StatCard label="In Transit" value="6" icon={Truck} accent="amber" />
        <StatCard label="Completed Deliveries" value="158" icon={CheckCircle2} accent="emerald" />
        <StatCard label="Performance Score" value="94%" icon={TrendingUp} accent="rose" />
      </div>
    </div>
  )
}