import { useEffect, useState } from 'react'
import {
  Package,
  Building2,
  ShoppingCart,
  AlertTriangle,
  Award,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { apiFetch } from '../../api'

const DARK = '#12281F'
const LIME = '#D7FF5F'
const LIME_TEXT = '#1F2E14'
const BAR = '#1F4B3D'

const PILL_COLORS = ['#F97316', '#12281F', '#0EA5A4', '#F43F5E', '#6366F1']

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

function StatBar({ label, value, max, selected, onClick }) {
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
          {label.replace(/_/g, ' ')}
        </span>
        <span className="font-semibold text-slate-800">{value}</span>
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

function StatCard({ label, value, caption, icon: Icon, accent = false, chip }) {
  if (accent) {
    return (
      <div
        style={{ backgroundColor: DARK }}
        className="group relative cursor-default overflow-hidden rounded-2xl p-5 text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      >
        <Icon
          size={92}
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-4 -right-4 text-white/[0.06] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6"
        />
        <div
          style={{ backgroundColor: LIME, color: LIME_TEXT }}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg"
        >
          <Icon size={18} />
        </div>
        <p className="relative mt-4 text-sm text-white/50">{label}</p>
        <p className="relative mt-1 text-2xl font-bold">{value}</p>
        {caption && <p className="relative mt-1 text-xs text-white/40">{caption}</p>}
      </div>
    )
  }

  return (
    <div className="group relative cursor-default overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Icon
        size={92}
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-4 -right-4 text-slate-900/[0.04] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6"
      />
      <div
        className="relative flex h-9 w-9 items-center justify-center rounded-lg"
        style={{
          backgroundColor: chip?.bg || '#F8FAFC',
          color: chip?.text || '#64748B',
        }}
      >
        <Icon size={18} />
      </div>
      <p className="relative mt-4 text-sm text-slate-500">{label}</p>
      <p className="relative mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {caption && <p className="relative mt-1 text-xs text-slate-400">{caption}</p>}
    </div>
  )
}

const PERIOD_LABEL = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedDrugId, setSelectedDrugId] = useState(null)
  const [pinnedDate, setPinnedDate] = useState(null)

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
      setError(err.message || 'Could not load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(period)
    setSelectedStatus(null)
    setSelectedDrugId(null)
    setPinnedDate(null)
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
            period === key
              ? 'text-white'
              : 'text-slate-500 hover:text-slate-800'
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
          Overview
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of the entire supply chain network
        </p>
      </div>

      {periodSelector}
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
            <p className="mt-3 text-sm text-slate-500">
              Loading dashboard...
            </p>
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
          <h2 className="font-semibold text-red-800">
            Could not load dashboard data
          </h2>

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

  const overview = analytics.overview || {}
  const orders = analytics.orders || {}
  const consumption = analytics.consumption || {}
  const inventory = analytics.inventory || {}
  const vendors = analytics.vendors || {}

  const orderStatuses = Object.entries(orders.byStatus || {}).filter(
    ([, value]) => value > 0
  )

  const maxOrderValue = Math.max(
    ...orderStatuses.map(([, value]) => value),
    1
  )

  const dailyTrend = consumption.dailyTrend || []

  const maxConsumption = Math.max(
    ...dailyTrend.map((item) => item.quantityConsumed || 0),
    1
  )

  const topDrugs = (consumption.topDrugs || []).slice(0, 5)
  const maxTopDrug = Math.max(
    ...topDrugs.map((item) => item.quantityConsumed || 0),
    1
  )
  const topDrugsTotal = topDrugs.reduce(
    (sum, item) => sum + (item.quantityConsumed || 0),
    0
  )

  const topVendors = (vendors.performance || []).slice(0, 5)
  const hospitalStock = inventory.byHospital || []

  return (
    <div className="space-y-6 pb-10">

      {header}

      {/* OVERVIEW STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Total Stock (units)"
          value={(overview.totalStock ?? 0).toLocaleString()}
          caption="Across all active batches"
          icon={Package}
          accent
        />

        <StatCard
          label="Connected Hospitals"
          value={overview.totalHospitals ?? 0}
          caption="Active network nodes"
          icon={Building2}
          chip={{ bg: '#EFF6FF', text: '#2563EB' }}
        />

        <StatCard
          label="Orders This Period"
          value={orders.total ?? 0}
          caption={PERIOD_LABEL[period]}
          icon={ShoppingCart}
          chip={{ bg: '#FFF7ED', text: '#EA580C' }}
        />

        <StatCard
          label="Critical Stock Items"
          value={overview.criticalStockDrugs ?? 0}
          caption={
            (overview.criticalStockDrugs ?? 0) > 0
              ? 'Needs immediate reorder'
              : 'All stock healthy'
          }
          icon={AlertTriangle}
          chip={
            (overview.criticalStockDrugs ?? 0) > 0
              ? { bg: '#FEF2F2', text: '#DC2626' }
              : { bg: '#ECFDF5', text: '#059669' }
          }
        />

      </div>

      {/* DAILY CONSUMPTION + TOP SELLING MEDICINE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* DAILY CONSUMPTION */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Daily Consumption Trend"
            description="Units consumed per day · hover or tap a bar"
            action={
              <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                {PERIOD_LABEL[period]}
              </span>
            }
          >
            {dailyTrend.length > 0 ? (
              <>
                <div className="overflow-x-auto border-b border-slate-200 pb-1">
                  <div className="flex h-48 min-w-full items-end gap-2">
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
                          onClick={() =>
                            setPinnedDate(isPinned ? null : item.date)
                          }
                          className="group relative flex h-full min-w-[16px] flex-1 cursor-pointer flex-col items-center justify-end"
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
                                  style={{
                                    color: change >= 0 ? LIME : '#FB7185',
                                  }}
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
                            className="w-full min-w-[10px] rounded-full transition-all duration-700 ease-out"
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
                      const isLatest =
                        index === dailyTrend.length - 1 && pinnedDate === null
                      const d = new Date(item.date)
                      const label = Number.isNaN(d.getTime())
                        ? item.date
                        : d.toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: dailyTrend.length > 14 ? undefined : 'short',
                          })

                      return (
                        <div
                          key={item.date}
                          className="min-w-[16px] flex-1 text-center"
                        >
                          <span
                            className={`text-[10px] ${
                              isLatest || isPinned
                                ? 'font-semibold text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-slate-500">Total consumed</span>

                  <span className="font-bold text-slate-900">
                    {(consumption.totalConsumed ?? 0).toLocaleString()} units
                  </span>
                </div>
              </>
            ) : (
              <EmptyState message="No consumption data for this period." />
            )}
          </SectionCard>
        </div>

        {/* TOP SELLING MEDICINE — interactive ranked list */}
        <SectionCard
          title="Top Selling Medicine"
          description="Tap a drug for details"
        >
          {topDrugs.length > 0 ? (
            <div className="space-y-2">
              {topDrugs.map((item, index) => {
                const id = item.drug?._id || index
                const isSelected = selectedDrugId === id
                const width =
                  ((item.quantityConsumed || 0) / maxTopDrug) * 100
                const shareOfTop =
                  topDrugsTotal > 0
                    ? (
                        ((item.quantityConsumed || 0) / topDrugsTotal) *
                        100
                      ).toFixed(1)
                    : 0
                const color = PILL_COLORS[index % PILL_COLORS.length]

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setSelectedDrugId(isSelected ? null : id)
                    }
                    className={`w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                      isSelected
                        ? 'shadow-sm'
                        : 'border-transparent hover:bg-slate-50'
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
                            {(item.quantityConsumed ?? 0).toLocaleString()}
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
                        <span>
                          {item.drug?.genericName || 'No generic name on file'}
                        </span>
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

      </div>

      {/* ORDER VOLUME + VENDOR RELIABILITY */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ORDER VOLUME */}
        <SectionCard
          title="Order Volume by Status"
          description={`${orders.total ?? 0} total orders in selected period · tap to highlight`}
        >
          {orderStatuses.length > 0 ? (
            orderStatuses.map(([status, value]) => (
              <StatBar
                key={status}
                label={status}
                value={value}
                max={maxOrderValue}
                selected={selectedStatus === status}
                onClick={() =>
                  setSelectedStatus(
                    selectedStatus === status ? null : status
                  )
                }
              />
            ))
          ) : (
            <EmptyState message="No order activity in this period." />
          )}
        </SectionCard>

        {/* VENDOR RELIABILITY */}
        <SectionCard
          title="Vendor Reliability Leaderboard"
          description="Top performing vendors"
          action={
            <div className="rounded-xl bg-slate-50 px-3 py-1.5 text-right">
              <span className="block text-xs text-slate-500">
                Avg reliability
              </span>

              <span className="text-lg font-bold text-slate-900">
                {vendors.averageReliability ?? 0}%
              </span>
            </div>
          }
        >
          {topVendors.length > 0 ? (
            <div className="space-y-3">
              {topVendors.map((item, index) => (
                <div
                  key={item.vendor?._id || index}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">

                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: LIME, color: LIME_TEXT }}
                    >
                      {index === 0 ? <Award size={16} /> : index + 1}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {item.vendor?.name || 'Unknown Vendor'}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.totalShipments ?? 0} shipments ·{' '}
                        {item.onTimePercentage !== null &&
                        item.onTimePercentage !== undefined
                          ? `${item.onTimePercentage}% on-time`
                          : 'No delivery data'}
                      </p>
                    </div>

                  </div>

                  <p className="font-semibold text-slate-800">
                    {item.reliabilityScore ?? 0}%
                  </p>

                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No vendor performance data available." />
          )}
        </SectionCard>

      </div>

      {/* HOSPITAL STOCK */}
      <SectionCard
        title="Hospital Stock Overview"
        description="Current stock held by each hospital"
      >
        {hospitalStock.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {hospitalStock.map((item, index) => (
              <div
                key={item.hospital?._id || index}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              >
                <p className="font-medium text-slate-800">
                  {item.hospital?.name || 'Unknown Hospital'}
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {(item.totalStock ?? 0).toLocaleString()}
                </p>

                <p className="text-xs text-slate-500">
                  units in stock
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No hospital inventory data available." />
        )}
      </SectionCard>

    </div>
  )
}