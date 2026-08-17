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

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-order reject reason
  const [rejectReason, setRejectReason] = useState({}) // { [orderId]: string }

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await apiFetch('/orders')
        setOrders(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  async function handleAccept(orderId) {
    try {
      const updated = await apiFetch(`/orders/${orderId}/accept`, { method: 'PATCH' })
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
    } catch (err) {
      alert('Accept failed: ' + err.message)
    }
  }

  async function handleReject(orderId) {
    const reason = rejectReason[orderId] || ''
    try {
      const updated = await apiFetch(`/orders/${orderId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      })
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
    } catch (err) {
      alert('Reject failed: ' + err.message)
    }
  }

  return (
    <div>
      <PageHeader title="Orders" description="View and manage incoming orders assigned to you" />

      {loading && <p className="text-sm text-slate-500">Loading orders…</p>}
      {error && <p className="text-sm text-rose-600">Failed to load orders: {error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-slate-500">No orders assigned to you yet.</p>
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
                  <td className="px-4 py-3 capitalize text-xs">{o.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.urgency === 'urgent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {o.urgency || 'normal'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.status === 'approved' && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleAccept(o._id)}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                        >
                          Accept
                        </button>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Reason…"
                            className="rounded border border-slate-300 px-1.5 py-1 text-xs w-24"
                            value={rejectReason[o._id] || ''}
                            onChange={(e) =>
                              setRejectReason((prev) => ({ ...prev, [o._id]: e.target.value }))
                            }
                          />
                          <button
                            onClick={() => handleReject(o._id)}
                            className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100"
                          >
                            Reject
                          </button>
                        </div>
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