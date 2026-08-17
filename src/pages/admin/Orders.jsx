import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { apiFetch } from '../../api'

const STATUS_COLORS = {
  requested:  'bg-blue-50 text-blue-700',
  approved:   'bg-emerald-50 text-emerald-700',
  accepted:   'bg-teal-50 text-teal-700',
  dispatched: 'bg-amber-50 text-amber-700',
  delivered:  'bg-green-50 text-green-700',
  rejected:   'bg-rose-50 text-rose-700',
  cancelled:  'bg-slate-100 text-slate-500',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-order approve state: which vendor is selected + loading flag
  const [approveState, setApproveState] = useState({}) // { [orderId]: { vendorId, submitting, suggestion } }

  useEffect(() => {
    async function fetchData() {
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
    fetchData()
  }, [])

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
    } catch {
      // Suggestion is optional — silently ignore
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

  return (
    <div>
      <PageHeader title="Orders" description="View and manage all orders across the network" />

      {loading && <p className="text-sm text-slate-500">Loading orders…</p>}
      {error && <p className="text-sm text-rose-600">Failed to load orders: {error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-slate-500">No orders found.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                <tr key={o._id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {o._id.substring(o._id.length - 6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{o.hospital?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {o.items?.map((it) => `${it.drug?.name ?? '?'} ×${it.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs">{o.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.urgency === 'urgent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {o.urgency || 'normal'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{o.vendor?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.status === 'requested' && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <select
                            className="rounded border border-slate-300 px-1.5 py-1 text-xs"
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
                              <option key={v._id} value={v._id}>{v.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => fetchSuggestion(o._id)}
                            className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-100"
                            title="Get AI suggestion"
                          >
                            Suggest
                          </button>
                        </div>
                        {approveState[o._id]?.suggestion && (
                          <p className="text-[10px] text-indigo-500">{approveState[o._id].suggestion}</p>
                        )}
                        <button
                          onClick={() => handleApprove(o._id)}
                          disabled={approveState[o._id]?.submitting}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
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
      )}
    </div>
  )
}