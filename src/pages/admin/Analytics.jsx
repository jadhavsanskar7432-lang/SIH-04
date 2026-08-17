import { useEffect, useState } from 'react'
import {
  Pill,
  Package,
  AlertTriangle,
  Building2,
  Users,
  Award,
  ChevronRight,
  CalendarClock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT, BAR } from '../../theme/adminColors'

const PILL_COLORS = ['#F97316', '#12281F', '#0EA5A4', '#F43F5E', '#6366F1']

const PERIOD_LABEL = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
}

function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
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
        style={{
          backgroundColor: chip?.bg || '#F8FAFC',
          color: chip?.text || '#64748B',
        }}
      >
        <Icon size={18} />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    healthy: 'bg-emerald-50 text-emerald-700',
    low: 'bg-amber-50 text-amber-700',
    critical: 'bg-rose-50 text-rose-700',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status] || 'bg-slate-50 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}

function StatBar({ label, value, max, suffix = '', selected, onClick }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 2

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-3 w-full rounded-lg p-2 text-left transition-colors ${
        selected ? 'bg-slate-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="mb-1 flex justify-between text-sm">
        <span
          className={`capitalize ${
            selected ? 'font-semibold text-slate-900' : 'text-slate-600'
          }`}
        >
          {label}
        </span>
        <span className="font-semibold text-slate-800">
          {value}
          {suffix}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: selected ? DARK : BAR,
          }}
        />
      </div>
    </button>
  )
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const [selectedOrderStatus, setSelectedOrderStatus] = useState(null)
  const [selectedShipmentStatus, setSelectedShipmentStatus] = useState(null)
  const [pinnedDate, setPinnedDate] = useState(null)
  const [selectedDrugId, setSelectedDrugId] = useState(null)

  const fetchAnalytics = async (selectedPeriod) => {
    try {
      setLoading(true)
      setError('')
      setMounted(false)

      const data = await apiFetch(
        `/insights/analytics?period=${selectedPeriod}`
      )

      setAnalytics(data)
    } catch (err) {
      console.error('Analytics error:', err)
      setError(err.message || 'Could not load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(period)
    setSelectedOrderStatus(null)
    setSelectedShipmentStatus(null)
    setPinnedDate(null)
    setSelectedDrugId(null)
  }, [period])

  useEffect(() => {
    if (!analytics) return
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [analytics])

  const periodSelector = (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {Object.keys(PERIOD_LABEL).map((key) => (
        <button
          key={key}
          onClick={() => setPeriod(key)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            period === key ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
          style={period === key ? { backgroundColor: DARK } : undefined}
        >
          {key.toUpperCase()}
        </button>
      ))}
    </div>
  )

  const header = (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Reporting
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Supply chain insights and reporting
        </p>
      </div>

      {periodSelector}
    </div>
  )

  if (loading) {
    return (
      <div>
        {header}

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading analytics...</p>
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
          <h2 className="font-semibold text-red-800">Could not load analytics</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>

          <button
            onClick={() => fetchAnalytics(period)}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const { overview, orders, shipments, consumption, inventory, vendors } =
    analytics

  const orderStatuses = Object.entries(orders.byStatus || {})
  const shipmentStatuses = Object.entries(shipments.byStatus || {})

  const maxOrderValue = Math.max(...orderStatuses.map(([, value]) => value), 1)
  const maxShipmentValue = Math.max(
    ...shipmentStatuses.map(([, value]) => value),
    1
  )

  const dailyTrend = consumption.dailyTrend || []
  const maxConsumption = Math.max(
    ...dailyTrend.map((item) => item.quantityConsumed || 0),
    1
  )

  const topDrugs = consumption.topDrugs || []
  const maxTopDrug = Math.max(
    ...topDrugs.map((item) => item.quantityConsumed || 0),
    1
  )
  const topDrugsTotal = topDrugs.reduce(
    (sum, item) => sum + (item.quantityConsumed || 0),
    0
  )

  return (
    <div className="space-y-6 pb-10">
      {header}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Stock"
          value={overview.totalStock.toLocaleString()}
          caption="Units currently in stock"
          icon={Package}
          accent
        />

        <StatCard
          label="Total Drugs"
          value={overview.totalDrugs}
          icon={Pill}
          chip={{ bg: '#EEF2FF', text: '#4F46E5' }}
        />

        <StatCard
          label="Low Stock"
          value={overview.lowStockDrugs}
          caption="Needs replenishment"
          icon={AlertTriangle}
          chip={{ bg: '#FFFBEB', text: '#D97706' }}
        />

        <StatCard
          label="Critical Stock"
          value={overview.criticalStockDrugs}
          caption="Immediate attention"
          icon={AlertTriangle}
          chip={
            overview.criticalStockDrugs > 0
              ? { bg: '#FEF2F2', text: '#DC2626' }
              : { bg: '#ECFDF5', text: '#059669' }
          }
        />

        <StatCard
          label="Hospitals"
          value={overview.totalHospitals}
          icon={Building2}
          chip={{ bg: '#EFF6FF', text: '#2563EB' }}
        />

        <StatCard
          label="Vendors"
          value={overview.totalVendors}
          icon={Users}
          chip={{ bg: '#F0FDFA', text: '#0D9488' }}
        />
      </div>

      {/* ORDERS + SHIPMENTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ORDERS */}
        <SectionCard
          title="Order Analytics"
          description={`${orders.total} total orders in selected period · tap to highlight`}
        >
          {orderStatuses.length > 0 ? (
            orderStatuses.map(([status, value]) => (
              <StatBar
                key={status}
                label={status.replace('_', ' ')}
                value={value}
                max={maxOrderValue}
                selected={selectedOrderStatus === status}
                onClick={() =>
                  setSelectedOrderStatus(
                    selectedOrderStatus === status ? null : status
                  )
                }
              />
            ))
          ) : (
            <EmptyState message="No order activity in this period." />
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Urgent</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {orders.byUrgency?.urgent || 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Normal</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {orders.byUrgency?.normal || 0}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* SHIPMENTS */}
        <SectionCard
          title="Shipment Performance"
          description={`${shipments.total} total shipments · tap to highlight`}
          action={
            <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">
              <p className="text-xs text-slate-500">On-time rate</p>
              <p className="text-xl font-bold text-slate-900">
                {shipments.deliveryPerformance !== null
                  ? `${shipments.deliveryPerformance}%`
                  : 'N/A'}
              </p>
            </div>
          }
        >
          {shipmentStatuses.length > 0 ? (
            shipmentStatuses.map(([status, value]) => (
              <StatBar
                key={status}
                label={status.replace('_', ' ')}
                value={value}
                max={maxShipmentValue}
                selected={selectedShipmentStatus === status}
                onClick={() =>
                  setSelectedShipmentStatus(
                    selectedShipmentStatus === status ? null : status
                  )
                }
              />
            ))
          ) : (
            <EmptyState message="No shipment activity in this period." />
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-600">On Time</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {shipments.onTime}
              </p>
            </div>

            <div className="rounded-xl bg-rose-50 p-4">
              <p className="text-xs text-rose-600">Late</p>
              <p className="mt-1 text-xl font-bold text-rose-700">
                {shipments.late}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* CONSUMPTION TREND */}
      <SectionCard
        title="Consumption Trend"
        description="Daily medicine consumption · hover or tap a bar"
        action={
          <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
            {PERIOD_LABEL[period]}
          </span>
        }
      >
        {dailyTrend.length > 0 ? (
          <>
            <div className="overflow-x-auto border-b border-slate-200 pb-1">
              <div className="flex h-64 min-w-full items-end gap-1.5">
                {dailyTrend.map((item, index) => {
                  const height =
                    ((item.quantityConsumed || 0) / maxConsumption) * 100
                  const isPinned = pinnedDate === item.date
                  const isLatest =
                    index === dailyTrend.length - 1 && pinnedDate === null
                  const showValueLabel = dailyTrend.length <= 14

                  const prevValue =
                    index > 0 ? dailyTrend[index - 1].quantityConsumed : null
                  const change =
                    prevValue != null && prevValue > 0
                      ? Math.round(
                          (((item.quantityConsumed || 0) - prevValue) /
                            prevValue) *
                            100
                        )
                      : null

                  return (
                    <div
                      key={item.date}
                      onClick={() => setPinnedDate(isPinned ? null : item.date)}
                      className="group relative flex h-full min-w-[12px] flex-1 cursor-pointer flex-col items-center justify-end"
                    >
                      <div
                        className={`pointer-events-none absolute -top-11 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold text-white transition-opacity ${
                          isLatest || isPinned
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        style={{ backgroundColor: DARK }}
                      >
                        <span className="flex items-center justify-center gap-1">
                          {item.quantityConsumed} units
                          {change != null && (
                            <span
                              className="flex items-center gap-0.5 text-[10px] font-bold"
                              style={{ color: change >= 0 ? LIME : '#FB7185' }}
                            >
                              {change >= 0 ? (
                                <TrendingUp size={10} />
                              ) : (
                                <TrendingDown size={10} />
                              )}
                              {change >= 0 ? '+' : ''}
                              {change}%
                            </span>
                          )}
                        </span>
                        <span className="block text-center text-[10px] font-normal text-white/50">
                          {item.date}
                        </span>
                      </div>

                      {showValueLabel && (
                        <span
                          className={`mb-1 text-[10px] font-semibold ${
                            isLatest || isPinned
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.quantityConsumed}
                        </span>
                      )}

                      <div
                        className="w-full min-w-[8px] rounded-t-md transition-all duration-700 ease-out"
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

              <div className="mt-1.5 flex min-w-full gap-1.5">
                {dailyTrend.map((item, index) => {
                  const isPinned = pinnedDate === item.date
                  const isLatest =
                    index === dailyTrend.length - 1 && pinnedDate === null

                  return (
                    <div key={item.date} className="min-w-[12px] flex-1 text-center">
                      <span
                        className={`hidden text-[10px] lg:inline ${
                          isLatest || isPinned
                            ? 'font-semibold text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 flex justify-between">
              <span className="text-sm text-slate-500">Total consumed</span>
              <span className="font-bold text-slate-900">
                {consumption.totalConsumed.toLocaleString()} units
              </span>
            </div>
          </>
        ) : (
          <EmptyState message="No consumption data for this period." />
        )}
      </SectionCard>

      {/* TOP DRUGS + INVENTORY */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* TOP CONSUMED — interactive ranked list */}
        <SectionCard title="Top Consumed Drugs" description="Tap a drug for details">
          {topDrugs.length > 0 ? (
            <div className="space-y-2">
              {topDrugs.map((item, index) => {
                const id = item.drug?._id || index
                const isSelected = selectedDrugId === id
                const width = ((item.quantityConsumed || 0) / maxTopDrug) * 100
                const shareOfTop =
                  topDrugsTotal > 0
                    ? (((item.quantityConsumed || 0) / topDrugsTotal) * 100).toFixed(1)
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
            <EmptyState message="No consumption data available." />
          )}
        </SectionCard>

        {/* INVENTORY */}
        <SectionCard title="Inventory Status" description="Current stock by drug">
          <div className="max-h-[430px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-medium text-slate-500">Drug</th>
                  <th className="pb-3 font-medium text-slate-500">Stock</th>
                  <th className="pb-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>

              <tbody>
                {inventory.byDrug?.map((drug) => (
                  <tr
                    key={drug.drugId}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="py-3">
                      <p className="font-medium text-slate-800">{drug.name}</p>
                      <p className="text-xs text-slate-400">
                        {drug.category || 'Uncategorized'}
                      </p>
                    </td>

                    <td className="py-3 font-semibold text-slate-800">
                      {drug.currentStock.toLocaleString()}
                    </td>

                    <td className="py-3">
                      <StatusBadge status={drug.stockStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* EXPIRING BATCHES */}
      <SectionCard
        title="Expiring Batches"
        description="Batches expiring within the next 30 days"
      >
        {inventory.expiringSoon?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-medium text-slate-500">Batch</th>
                  <th className="pb-3 font-medium text-slate-500">Drug</th>
                  <th className="pb-3 font-medium text-slate-500">Quantity</th>
                  <th className="pb-3 font-medium text-slate-500">Expiry</th>
                  <th className="pb-3 font-medium text-slate-500">Location</th>
                </tr>
              </thead>

              <tbody>
                {inventory.expiringSoon.map((batch) => (
                  <tr
                    key={batch.batchId}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="py-3 font-medium text-slate-800">
                      {batch.batchNumber}
                    </td>

                    <td className="py-3 text-slate-700">
                      {batch.drug?.name || 'Unknown'}
                    </td>

                    <td className="py-3 text-slate-700">{batch.quantity}</td>

                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                        <CalendarClock size={12} />
                        {new Date(batch.expiryDate).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3 text-slate-600">
                      {batch.currentLocation?.name || 'In transit'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 p-5 text-center text-sm text-emerald-700">
            No batches are expiring within the next 30 days.
          </div>
        )}
      </SectionCard>

      {/* VENDOR PERFORMANCE */}
      <SectionCard
        title="Vendor Performance"
        description="Reliability and shipment performance"
        action={
          <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">
            <span className="text-xs text-slate-500">Average reliability</span>
            <p className="text-xl font-bold text-slate-900">
              {vendors.averageReliability}%
            </p>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium text-slate-500">Vendor</th>
                <th className="pb-3 font-medium text-slate-500">Reliability</th>
                <th className="pb-3 font-medium text-slate-500">Shipments</th>
                <th className="pb-3 font-medium text-slate-500">Delivered</th>
                <th className="pb-3 font-medium text-slate-500">On Time</th>
                <th className="pb-3 font-medium text-slate-500">Late</th>
                <th className="pb-3 font-medium text-slate-500">Failed</th>
                <th className="pb-3 font-medium text-slate-500">On-time %</th>
              </tr>
            </thead>

            <tbody>
              {vendors.performance?.map((item, index) => (
                <tr
                  key={item.vendor?._id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="py-3 font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      {index === 0 && (
                        <Award size={14} style={{ color: '#B45309' }} />
                      )}
                      {item.vendor?.name || 'Unknown'}
                    </span>
                  </td>

                  <td className="py-3 font-semibold text-slate-800">
                    {item.reliabilityScore}%
                  </td>

                  <td className="py-3 text-slate-600">{item.totalShipments}</td>
                  <td className="py-3 text-slate-600">{item.delivered}</td>
                  <td className="py-3 text-emerald-600">{item.onTime}</td>
                  <td className="py-3 text-amber-600">{item.late}</td>
                  <td className="py-3 text-rose-600">{item.failed}</td>

                  <td className="py-3 font-semibold text-slate-800">
                    {item.onTimePercentage !== null
                      ? `${item.onTimePercentage}%`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* HOSPITAL STOCK */}
      <SectionCard
        title="Hospital Inventory"
        description="Current stock held by each hospital"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {inventory.byHospital?.length > 0 ? (
            inventory.byHospital.map((item) => (
              <div
                key={item.hospital?._id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              >
                <p className="font-medium text-slate-800">
                  {item.hospital?.name || 'Unknown Hospital'}
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {item.totalStock.toLocaleString()}
                </p>

                <p className="text-xs text-slate-500">units in stock</p>
              </div>
            ))
          ) : (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">
              No hospital inventory data available.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}