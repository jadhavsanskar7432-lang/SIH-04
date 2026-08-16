import { Package, Building2, ShoppingCart, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { useApp } from '../../context/AppContext'

export default function AdminDashboard() {
  const { batches, hospitals, orders, alerts, drugs, consumptionLog } = useApp()

  const totalUnits = batches.reduce((sum, b) => sum + b.qty, 0)
  const activeOrders = orders.filter((o) => o.status !== 'delivered').length
  const criticalAlerts = alerts.filter((a) => a.level === 'critical').length

  const maxDaily = Math.max(...consumptionLog.map((c) => c.avgDailyUnits), 1)

  return (
    <div>
      <PageHeader eyebrow="Admin / Govt" title="Dashboard" description="Overview of the entire supply chain network" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard dark label="Total Units in Stock" value={totalUnits.toLocaleString()} icon={Package} delta="+2%" />
        <StatCard label="Connected Hospitals" value={hospitals.length} icon={Building2} delta="+0.2%" />
        <StatCard label="Active Orders" value={activeOrders} icon={ShoppingCart} delta="+6%" />
        <StatCard label="Critical Alerts" value={criticalAlerts} icon={AlertTriangle} delta={criticalAlerts ? '-4%' : '+0%'} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Daily Consumption</h2>
            <span className="text-xs text-ink-faint">By drug</span>
          </div>
          <div className="flex h-40 items-end gap-4">
            {consumptionLog.map((c) => {
              const drug = drugs.find((d) => d.id === c.drugId)
              const heightPct = (c.avgDailyUnits / maxDaily) * 100
              return (
                <div key={`${c.hospitalId}-${c.drugId}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end rounded-lg bg-paper-dim">
                    <div
                      className="w-full rounded-lg bg-panel"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-center text-[11px] leading-tight text-ink-faint">
                    {drug?.name.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Recent Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => {
              const drug = drugs.find((d) => d.id === o.drugId)
              return (
                <div key={o.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{drug?.name}</p>
                    <p className="text-xs text-ink-faint">{o.id} · {o.qty} {drug?.unit}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.status === 'accepted' ? 'bg-moss-soft text-moss' : 'bg-gold-soft text-gold'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              )
            })}
            {orders.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-faint">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}