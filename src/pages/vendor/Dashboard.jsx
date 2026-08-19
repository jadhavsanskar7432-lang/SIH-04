import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Truck, CheckCircle2, TrendingUp, ChevronRight, PackageCheck, AlertCircle, ClipboardList } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonStatCards } from '../../components/ui/Skeleton'
import { apiFetch } from '../../api'
import { useAuth } from '../../context/AuthContext'

const ORDER_STATUS_COLORS = {
  requested: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  accepted: 'bg-teal-50 text-teal-700',
  dispatched: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  rejected: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

const SHIPMENT_STATUS_COLORS = {
  pending: 'bg-slate-100 text-slate-600',
  in_transit: 'bg-amber-50 text-amber-700',
  delayed: 'bg-rose-50 text-rose-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
}

function SectionCard({ title, description, action, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-popover">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function VendorDashboard() {
  const { user } = useAuth()

  const [orders, setOrders] = useState([])
  const [shipments, setShipments] = useState([])
  const [reliabilityScore, setReliabilityScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [orderData, shipmentData] = await Promise.all([
          apiFetch('/orders'),
          apiFetch('/shipments'),
        ])
        setOrders(Array.isArray(orderData) ? orderData : [])
        setShipments(Array.isArray(shipmentData) ? shipmentData : [])

        // Reliability score lives on the vendor's own user record.
        // Non-fatal if it fails — the rest of the dashboard still works.
        const id = user?._id || user?.id
        if (id) {
          try {
            const vendorData = await apiFetch(`/vendors/${id}`)
            setReliabilityScore(vendorData?.reliabilityScore ?? null)
          } catch (err) {
            console.error('Failed to load vendor profile:', err)
          }
        }
      } catch (err) {
        setError(err.message || 'Could not load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const header = (
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Overview</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview of your orders and deliveries</p>
    </div>
  )

  if (loading) {
    return (
      <div>
        {header}
        <SkeletonStatCards count={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {header}
        <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <div>
            <p className="text-sm font-medium text-danger-700">Failed to load dashboard</p>
            <p className="mt-0.5 text-sm text-danger-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Derived stats (computed from real, vendor-scoped data) ───────────────
  const activeOrders = orders.filter((o) =>
    ['approved', 'accepted', 'dispatched'].includes(o.status)
  )
  const pendingAcceptance = orders.filter((o) => o.status === 'approved').length
  const inTransitShipments = shipments.filter((s) => s.status === 'in_transit').length
  const completedDeliveries = shipments.filter((s) => s.status === 'delivered').length

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Overview of your orders and deliveries"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Orders" value={activeOrders.length} icon={ShoppingCart} accent="indigo" />
        <StatCard label="In Transit" value={inTransitShipments} icon={Truck} accent="amber" />
        <StatCard label="Completed Deliveries" value={completedDeliveries} icon={CheckCircle2} accent="emerald" />
        <StatCard
          label="Performance Score"
          value={reliabilityScore != null ? `${reliabilityScore}%` : '—'}
          icon={TrendingUp}
          accent="rose"
        />
      </div>

      {pendingAcceptance > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3.5 shadow-card">
          <div className="flex items-center gap-2.5 text-sm text-warning-700">
            <PackageCheck size={18} className="shrink-0" />
            <span>
              You have <strong>{pendingAcceptance}</strong> order{pendingAcceptance !== 1 ? 's' : ''} awaiting your acceptance.
            </span>
          </div>
          <Link
            to="/vendor/orders"
            className="flex items-center gap-1 text-xs font-semibold text-warning-700 transition-colors hover:underline"
          >
            Review orders <ChevronRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Recent Orders"
          action={
            <Link
              to="/vendor/orders"
              className="flex items-center gap-1 text-xs font-semibold text-brand-900 transition-colors hover:underline"
            >
              View all <ChevronRight size={12} />
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Orders a hospital places with you will show up here once approved by admin."
            />
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div
                  key={o._id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 transition-colors hover:bg-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{o.hospital?.name ?? 'Unknown hospital'}</p>
                    <p className="font-mono text-xs text-slate-400">
                      {o._id.substring(o._id.length - 6).toUpperCase()}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status] || ''}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Shipments"
          action={
            <Link
              to="/vendor/shipments"
              className="flex items-center gap-1 text-xs font-semibold text-brand-900 transition-colors hover:underline"
            >
              View all <ChevronRight size={12} />
            </Link>
          }
        >
          {recentShipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No shipments yet"
              description="Shipments you dispatch for accepted orders will show up here."
            />
          ) : (
            <div className="space-y-2">
              {recentShipments.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 transition-colors hover:bg-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{s.to?.name ?? 'Unknown hospital'}</p>
                    <p className="text-xs text-slate-400">
                      {s.expectedDelivery ? `ETA ${new Date(s.expectedDelivery).toLocaleDateString()}` : 'ETA unknown'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${SHIPMENT_STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-500'}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {orders.length === 0 && shipments.length === 0 && (
        <SectionCard title="Getting started">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <ClipboardList size={18} className="shrink-0 text-slate-400" />
            Orders assigned to you by admin will appear here — once you accept one, you can dispatch a shipment for it.
          </div>
        </SectionCard>
      )}
    </div>
  )
}
