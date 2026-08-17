import { useEffect, useState } from 'react'
import { Package, ClipboardList, ShoppingCart, CalendarClock } from 'lucide-react'
import { apiFetch } from '../../api'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

export default function HospitalDashboard() {
  const [stats, setStats] = useState({
    stockItems: '—',
    monthlyConsumption: '—',
    pendingOrders: '—',
    expiringSoon: '—',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fire all requests in parallel — all are role-scoped on the backend
        const [batches, consumption, orders] = await Promise.all([
          apiFetch('/batches'),
          apiFetch('/consumption?days=30'),
          apiFetch('/orders'),
        ])

        // Stock items: count of in_stock batches
        const stockItems = batches.filter((b) => b.status === 'in_stock').length

        // Monthly consumption: sum quantityUsed from last 30 days
        const monthlyConsumption = consumption.reduce(
          (sum, log) => sum + (log.quantityUsed || 0),
          0
        )

        // Pending orders: orders with status "requested" or "approved"
        const pendingOrders = orders.filter(
          (o) => o.status === 'requested' || o.status === 'approved'
        ).length

        // Expiring soon: batches expiring within the next 30 days
        const now = new Date()
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const expiringSoon = batches.filter((b) => {
          if (b.status !== 'in_stock') return false
          const exp = new Date(b.expiryDate)
          return exp <= thirtyDaysFromNow && exp >= now
        }).length

        setStats({
          stockItems: stockItems.toLocaleString(),
          monthlyConsumption: monthlyConsumption.toLocaleString(),
          pendingOrders: pendingOrders.toLocaleString(),
          expiringSoon: expiringSoon.toLocaleString(),
        })
      } catch (err) {
        // On error, leave dashes in place — non-critical dashboard stats
        console.error('Dashboard stats error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your hospital's supply status" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Stock Items"
          value={loading ? '…' : stats.stockItems}
          icon={Package}
          accent="indigo"
        />
        <StatCard
          label="Monthly Consumption"
          value={loading ? '…' : stats.monthlyConsumption}
          icon={ClipboardList}
          accent="emerald"
        />
        <StatCard
          label="Pending Orders"
          value={loading ? '…' : stats.pendingOrders}
          icon={ShoppingCart}
          accent="amber"
        />
        <StatCard
          label="Expiring Soon"
          value={loading ? '…' : stats.expiringSoon}
          icon={CalendarClock}
          accent="rose"
        />
      </div>
    </div>
  )
}