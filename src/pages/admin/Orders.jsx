import { useEffect, useState } from 'react'
import { ShoppingCart, Sparkles, Building2, AlertCircle, Zap } from 'lucide-react'
import { apiFetch } from '../../api'
import { getSocket } from '../../socket'
import { LIME, LIME_TEXT } from '../../theme/adminColors'
import OrderStepper from '../../components/ui/OrderStepper'
import EmptyState from '../../components/ui/EmptyState'

const PRIORITY_STYLES = {
  critical: 'bg-danger-50 text-danger-700',
  high: 'bg-warning-50 text-warning-700',
  medium: 'bg-info-50 text-info-700',
  low: 'bg-slate-100 text-slate-500',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-order approve state: which vendor is selected + loading flag
  const [approveState, setApproveState] = useState({}) // { [orderId]: { vendorId, submitting, suggestion } }

  useEffect(() => {
    fetchData()
  }, [])

  // Live updates: backend emits "order:update" to the hospital's and (once
  // assigned) vendor's room whenever an order changes. Admin isn't in
  // either room, so refetch quietly (no loading flicker) on any order event
  // from any hospital/vendor — cheap since this only fires on real actions.
  useEffect(() => {
    const socket = getSocket()
    const onUpdate = async () => {
      try {
        const data = await apiFetch('/orders')
        setOrders(data)
      } catch {
        // ignore transient refetch errors
      }
    }
    socket.on('order:update', onUpdate)
    return () => socket.off('order:update', onUpdate)
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [ordersData, vendorsData] = await Promise.all([
        apiFetch('/orders'),
        apiFetch('/vendors'),
      ])
      setOrders(ordersData)
      setVendors(vendorsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSuggestion(orderId) {
    try {
      const data = await apiFetch(`/insights/suggest-vendor/${orderId}`)
      setApproveState((prev) => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          vendorId: data.suggestedVendor?._id || '',
          suggestion: `Suggested: ${data.suggestedVendor?.name} (${data.reason})`,
        },
      }))
    } catch (err) {
      setApproveState((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], suggestion: `Could not get a suggestion: ${err.message}` },
      }))
    }
  }

  async function handleApprove(orderId) {
    const state = approveState[orderId]
    if (!state?.vendorId) return alert('Select a vendor first')

    setApproveState((prev) => ({ ...prev, [orderId]: { ...prev[orderId], submitting: true } }))
    try {
      const updated = await apiFetch(`/orders/${orderId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ vendor: state.vendorId }),
      })
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
    } catch (err) {
      alert('Approve failed: ' + err.message)
    } finally {
      setApproveState((prev) => ({ ...prev, [orderId]: { ...prev[orderId], submitting: false } }))
    }
  }

  const activeCount = orders.filter((o) =>
    ['requested', 'approved', 'accepted', 'dispatched'].includes(o.status)
  ).length

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Procurement</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all orders across the network · {activeCount} active
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <div>
            <p className="text-sm font-medium text-danger-700">Could not load orders</p>
            <p className="mt-0.5 text-sm text-danger-600">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Orders placed by hospitals across the network will show up here."
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => {
            const accentColor =
              o.status === 'rejected' || o.status === 'cancelled'
                ? '#94A3B8'
                : o.urgency === 'urgent'
                ? '#F43F5E'
                : LIME

            return (
              <div
                key={o._id}
                className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-popover"
              >
                <div className="w-1.5 shrink-0" style={{ backgroundColor: accentColor }} />

                <div className="flex-1 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          #{o._id.substring(o._id.length - 6).toUpperCase()}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${PRIORITY_STYLES[o.priority] || 'bg-slate-100 text-slate-500'}`}>
                          {o.priority} priority
                        </span>
                        {o.urgency === 'urgent' && (
                          <span className="flex items-center gap-1 rounded-full bg-danger-50 px-2 py-0.5 text-[10px] font-semibold text-danger-700">
                            <Zap size={10} /> Urgent
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 flex items-center gap-1.5 text-base font-semibold text-slate-900">
                        <Building2 size={15} className="text-slate-400" />
                        {o.hospital?.name ?? 'Unknown hospital'}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.items?.map((it, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {it.drug?.name ?? 'Unknown'} × {it.quantity}
                          </span>
                        ))}
                      </div>

                      {o.notes && <p className="mt-2 text-xs italic text-slate-400">"{o.notes}"</p>}

                      {o.vendor?.name && (
                        <p className="mt-2 text-xs text-slate-500">
                          Vendor: <span className="font-medium text-slate-700">{o.vendor.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="w-full sm:w-auto sm:min-w-[280px]">
                      <OrderStepper status={o.status} />
                    </div>
                  </div>

                  {o.status === 'requested' && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <select
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#12281F]"
                        value={approveState[o._id]?.vendorId || ''}
                        onChange={(e) =>
                          setApproveState((prev) => ({
                            ...prev,
                            [o._id]: { ...prev[o._id], vendorId: e.target.value },
                          }))
                        }
                      >
                        <option value="">Select vendor…</option>
                        {vendors.map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => fetchSuggestion(o._id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#F5F7ED', color: '#4F5D22' }}
                        title="Get vendor suggestion"
                      >
                        <Sparkles size={12} />
                        Suggest
                      </button>

                      <button
                        onClick={() => handleApprove(o._id)}
                        disabled={approveState[o._id]?.submitting}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: LIME, color: LIME_TEXT }}
                      >
                        {approveState[o._id]?.submitting ? 'Approving…' : 'Approve'}
                      </button>

                      {approveState[o._id]?.suggestion && (
                        <p className="w-full text-[11px] text-slate-500">{approveState[o._id].suggestion}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
