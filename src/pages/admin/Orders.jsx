import { useEffect, useState } from 'react'
import { ShoppingCart, Sparkles } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT } from '../../theme/adminColors'

const STATUS_COLORS = {
  requested: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  accepted: 'bg-teal-50 text-teal-700',
  dispatched: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  rejected: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
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

  // Fetch suggested vendor for a specific order
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
        [orderId]: {
          ...prev[orderId],
          suggestion: `Could not get a suggestion: ${err.message}`,
        },
      }))
    }
  }

  async function handleApprove(orderId) {
    const state = approveState[orderId]
    if (!state?.vendorId) return alert('Select a vendor first')

    setApproveState((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], submitting: true },
    }))
    try {
      const updated = await apiFetch(`/orders/${orderId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ vendor: state.vendorId }),
      })
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
    } catch (err) {
      alert('Approve failed: ' + err.message)
    } finally {
      setApproveState((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], submitting: false },
      }))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Procurement
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all orders across the network
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading orders...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Could not load orders</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <ShoppingCart size={28} className="mb-2 text-slate-300" />
          No orders found.
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Hospital</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Urgency</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Vendor</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((o) => (
                  <tr key={o._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {o._id.substring(o._id.length - 6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {o.hospital?.name ?? '—'}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-xs text-slate-500">
                      {o.items
                        ?.map((it) => `${it.drug?.name ?? '?'} ×${it.quantity}`)
                        .join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize">{o.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.urgency === 'urgent'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {o.urgency || 'normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {o.vendor?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[o.status] || ''
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {o.status === 'requested' && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <select
                              className="rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none focus:border-[#12281F]"
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
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
                              style={{ backgroundColor: '#F5F7ED', color: '#4F5D22' }}
                              title="Get vendor suggestion"
                            >
                              <Sparkles size={12} />
                              Suggest
                            </button>
                          </div>
                          {approveState[o._id]?.suggestion && (
                            <p className="text-[10px] text-slate-500">
                              {approveState[o._id].suggestion}
                            </p>
                          )}
                          <button
                            onClick={() => handleApprove(o._id)}
                            disabled={approveState[o._id]?.submitting}
                            className="rounded-lg px-2 py-1 text-xs font-semibold transition-opacity disabled:opacity-50"
                            style={{ backgroundColor: LIME, color: LIME_TEXT }}
                          >
                            {approveState[o._id]?.submitting ? 'Approving…' : 'Approve'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
