import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Pill,
  ShoppingCart,
  CalendarClock,
  AlertTriangle,
  Award,
  ChevronRight,
  Truck,
  ShieldCheck,
} from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT, BAR } from '../../theme/adminColors'

const PILL_COLORS = ['#F97316', '#12281F', '#0EA5A4', '#F43F5E', '#6366F1']

const SEVERITY_STYLES = {
  red: { border: 'border-rose-200', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700' },
  yellow: { border: 'border-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  green: { border: 'border-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
}

const SHIPMENT_STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-600',
  in_transit: 'bg-amber-50 text-amber-700',
  delayed: 'bg-rose-50 text-rose-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
}

function SectionCard({ title, description, action, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-slate-400">
      {message}
    </div>
  )
}

function StatCard({ label, value, caption, icon: Icon, accent = false, chip }) {
  if (accent) {
    return (
      <div
        style={{ backgroundColor: DARK }}
        className="cursor-default rounded-2xl p-5 text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div
          style={{ backgroundColor: LIME, color: LIME_TEXT }}
          className="flex h-9 w-9 items-center justify-center rounded-lg"
        >
          <Icon size={18} />
        </div>
        <p className="mt-4 text-sm text-white/50">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {caption && <p className="mt-1 text-xs text-white/40">{caption}</p>}
      </div>
    )
  }

  return (
    <div className="cursor-default rounded-2xl border border-slate-200 bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: chip?.bg || '#F8FAFC', color: chip?.text || '#64748B' }}
      >
        <Icon size={18} />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
    </div>
  )
}

export default function HospitalDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const [batches, setBatches] = useState([])
  const [consumption, setConsumption] = useState([])
  const [orders, setOrders] = useState([])
  const [shipments, setShipments] = useState([])
  const [alerts, setAlerts] = useState([])

  const [pinnedDate, setPinnedDate] = useState(null)
  const [selectedDrugId, setSelectedDrugId] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const [batchData, consumptionData, orderData, shipmentData, alertData] =
          await Promise.all([
            apiFetch('/batches'),
            apiFetch('/consumption?days=30'),
            apiFetch('/orders'),
            apiFetch('/shipments'),
            apiFetch('/insights/alerts'),
          ])
        setBatches(batchData)
        setConsumption(consumptionData)
        setOrders(orderData)
        setShipments(shipmentData)
        setAlerts(Array.isArray(alertData) ? alertData : [])
      } catch (err) {
        setError(err.message || 'Could not load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (loading) return
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [loading])

  const header = (
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Overview</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Overview of your hospital's supply status
      </p>
    </div>
  )

  if (loading) {
    return (
      <div>
        {header}
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Could not load dashboard data</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  // ── Derived stats (all computed from real, hospital-scoped data) ─────────
  const inStockBatches = batches.filter((b) => b.status === 'in_stock' && b.quantity > 0)
  const totalStock = inStockBatches.reduce((sum, b) => sum + b.quantity, 0)
  const distinctDrugs = new Set(inStockBatches.map((b) => b.drug?._id)).size

  const pendingOrders = orders.filter((o) =>
    ['requested', 'approved'].includes(o.status)
  ).length

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = inStockBatches.filter((b) => {
    const exp = new Date(b.expiryDate)
    return exp >= now && exp <= in30Days
  }).length

  const redAlerts = alerts.filter((a) => a.severity === 'red').length
  const yellowAlerts = alerts.filter((a) => a.severity === 'yellow').length
  const urgentAlerts = redAlerts + yellowAlerts

  // Daily consumption trend — last 7 days, derived from the 30-day log set
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const dailyMap = {}
  consumption
    .filter((log) => new Date(log.date) >= sevenDaysAgo)
    .forEach((log) => {
      const key = new Date(log.date).toISOString().split('T')[0]
      dailyMap[key] = (dailyMap[key] || 0) + (log.quantityUsed || 0)
    })
  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, qty]) => ({ date, quantityConsumed: qty }))
  const maxConsumption = Math.max(...dailyTrend.map((d) => d.quantityConsumed), 1)

  // Top consumed drugs — last 30 days
  const drugMap = {}
  consumption.forEach((log) => {
    if (!log.drug) return
    const id = log.drug._id
    if (!drugMap[id]) drugMap[id] = { drug: log.drug, quantityConsumed: 0 }
    drugMap[id].quantityConsumed += log.quantityUsed || 0
  })
  const topDrugs = Object.values(drugMap)
    .sort((a, b) => b.quantityConsumed - a.quantityConsumed)
    .slice(0, 5)
  const maxTopDrug = Math.max(...topDrugs.map((d) => d.quantityConsumed), 1)
  const topDrugsTotal = topDrugs.reduce((sum, d) => sum + d.quantityConsumed, 0)

  // Incoming shipments — active ones first
  const activeShipments = shipments
    .filter((s) => ['pending', 'in_transit', 'delayed'].includes(s.status))
    .slice(0, 4)

  const sortedAlerts = [...alerts]
    .sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 }
      return order[a.severity] - order[b.severity]
    })
    .slice(0, 4)

  return (
    <div className="space-y-6 pb-10">
      {header}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Stock (units)"
          value={totalStock.toLocaleString()}
          caption={`${distinctDrugs} drug${distinctDrugs !== 1 ? 's' : ''} in stock`}
          icon={Package}
          accent
        />
        <StatCard
          label="Pending Orders"
          value={pendingOrders}
          caption="Requested or approved"
          icon={ShoppingCart}
          chip={{ bg: '#FFF7ED', text: '#EA580C' }}
        />
        <StatCard
          label="Expiring Soon"
          value={expiringSoon}
          caption="Within 30 days"
          icon={CalendarClock}
          chip={{ bg: '#FFFBEB', text: '#D97706' }}
        />
        <StatCard
          label="Stock Alerts"
          value={urgentAlerts}
          caption={urgentAlerts > 0 ? `${redAlerts} critical, ${yellowAlerts} warning` : 'All stock healthy'}
          icon={AlertTriangle}
          chip={
            urgentAlerts > 0
              ? { bg: '#FEF2F2', text: '#DC2626' }
              : { bg: '#ECFDF5', text: '#059669' }
          }
        />
      </div>

      {/* CONSUMPTION + ALERTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Daily Consumption Trend"
            description="Units consumed per day · last 7 days · tap a bar"
          >
            {dailyTrend.length > 0 ? (
              <>
                <div className="overflow-x-auto border-b border-slate-200 pb-1">
                  <div className="flex h-40 min-w-full items-end gap-2">
                    {dailyTrend.map((item, index) => {
                      const height = (item.quantityConsumed / maxConsumption) * 100
                      const isPinned = pinnedDate === item.date
                      const isLatest = index === dailyTrend.length - 1 && pinnedDate === null

                      return (
                        <div
                          key={item.date}
                          onClick={() => setPinnedDate(isPinned ? null : item.date)}
                          className="group relative flex h-full min-w-[16px] flex-1 cursor-pointer flex-col items-center justify-end"
                        >
                          <div
                            className={`pointer-events-none absolute -top-9 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold text-white transition-opacity ${
                              isLatest || isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            style={{ backgroundColor: DARK }}
                          >
                            {item.quantityConsumed} units
                          </div>
                          <div
                            className="w-full min-w-[10px] rounded-t-md transition-all duration-700 ease-out"
                            style={{
                              height: mounted ? `${Math.max(height, 3)}%` : '0%',
                              ...(isLatest || isPinned
                                ? {
                                    backgroundImage: `repeating-linear-gradient(45deg, ${LIME}, ${LIME} 4px, ${DARK} 4px, ${DARK} 8px)`,
                                  }
                                : { backgroundColor: BAR }),
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-1.5 flex min-w-full gap-2">
                    {dailyTrend.map((item, index) => {
                      const isPinned = pinnedDate === item.date
                      const isLatest = index === dailyTrend.length - 1 && pinnedDate === null
                      const d = new Date(item.date)
                      return (
                        <div key={item.date} className="min-w-[16px] flex-1 text-center">
                          <span
                            className={`text-[10px] ${
                              isLatest || isPinned ? 'font-semibold text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-slate-500">Total consumed (7d)</span>
                  <span className="font-bold text-slate-900">
                    {dailyTrend.reduce((s, d) => s + d.quantityConsumed, 0).toLocaleString()} units
                  </span>
                </div>
              </>
            ) : (
              <EmptyState message="No consumption logged in the last 7 days." />
            )}
          </SectionCard>
        </div>

        {/* STOCK ALERTS QUICK PANEL */}
        <SectionCard title="Stock Alerts" description="Highest severity first">
          {sortedAlerts.length > 0 ? (
            <div className="space-y-2">
              {sortedAlerts.map((alert, index) => {
                const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.green
                return (
                  <div
                    key={`${alert.drug?._id || alert.drug}-${index}`}
                    className={`rounded-xl border p-3 ${s.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      <span className="text-sm font-medium text-slate-900">
                        {alert.drug?.name || alert.drug}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {alert.daysOfStockLeft != null
                        ? `${alert.daysOfStockLeft}d of stock left`
                        : 'No burn-rate data yet'}
                    </p>
                  </div>
                )
              })}
              <Link
                to="/hospital/alerts"
                className="mt-2 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold"
                style={{ color: DARK }}
              >
                View all alerts
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-sm text-slate-400">
              <ShieldCheck size={24} className="mb-2 text-slate-300" />
              No stock alerts right now.
            </div>
          )}
        </SectionCard>
      </div>

      {/* TOP DRUGS + SHIPMENTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Top Consumed Drugs" description="Last 30 days · tap for details">
          {topDrugs.length > 0 ? (
            <div className="space-y-2">
              {topDrugs.map((item, index) => {
                const id = item.drug?._id || index
                const isSelected = selectedDrugId === id
                const width = (item.quantityConsumed / maxTopDrug) * 100
                const shareOfTop =
                  topDrugsTotal > 0
                    ? ((item.quantityConsumed / topDrugsTotal) * 100).toFixed(1)
                    : 0
                const color = PILL_COLORS[index % PILL_COLORS.length]

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedDrugId(isSelected ? null : id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                      isSelected ? 'shadow-sm' : 'border-transparent hover:bg-slate-50'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: `${color}14`, borderColor: `${color}55` }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {index === 0 ? <Award size={13} /> : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {item.drug?.name || 'Unknown Drug'}
                          </p>
                          <span className="shrink-0 text-sm font-semibold text-slate-800">
                            {item.quantityConsumed.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: mounted ? `${Math.max(width, 4)}%` : '0%',
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`shrink-0 text-slate-300 transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                        <span>{item.drug?.genericName || 'No generic name on file'}</span>
                        <span className="font-semibold text-slate-700">
                          {shareOfTop}% of top {topDrugs.length}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState message="No consumption data logged yet." />
          )}
        </SectionCard>

        <SectionCard
          title="Incoming Shipments"
          description="Vendor deliveries in progress"
          action={
            <Link
              to="/hospital/shipments"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: DARK }}
            >
              View all
              <ChevronRight size={12} />
            </Link>
          }
        >
          {activeShipments.length > 0 ? (
            <div className="space-y-3">
              {activeShipments.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#F5F7ED', color: '#4F5D22' }}
                  >
                    <Truck size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {s.from?.name || 'Unknown vendor'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.expectedDelivery
                        ? `ETA ${new Date(s.expectedDelivery).toLocaleDateString()}`
                        : 'ETA unknown'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      SHIPMENT_STATUS_STYLES[s.status] || 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-sm text-slate-400">
              <Pill size={24} className="mb-2 text-slate-300" />
              No shipments currently in transit.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
