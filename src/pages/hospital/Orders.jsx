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

export default function HospitalOrders() {
  const [orders, setOrders] = useState([])
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create-order form state
  const [showForm, setShowForm] = useState(false)
  const [formDrug, setFormDrug] = useState('')
  const [formQty, setFormQty] = useState(10)
  const [formPriority, setFormPriority] = useState('medium')
  const [formUrgency, setFormUrgency] = useState('normal')
  const [formNotes, setFormNotes] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersData, drugsData] = await Promise.all([
          apiFetch('/orders'),
          apiFetch('/drugs'),
        ])
        setOrders(ordersData)
        setDrugs(drugsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!formDrug) return setFormError('Select a drug')

    setFormSubmitting(true)
    setFormError(null)
    try {
      const newOrder = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ drug: formDrug, quantity: Number(formQty) }],
          priority: formPriority,
          urgency: formUrgency,
          notes: formNotes || undefined,
        }),
      })
      setOrders((prev) => [newOrder, ...prev])
      setShowForm(false)
      setFormDrug('')
      setFormQty(10)
      setFormPriority('medium')
      setFormUrgency('normal')
      setFormNotes('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  async function handleCancel(orderId) {
    if (!confirm('Cancel this order?')) return
    try {
      const updated = await apiFetch(`/orders/${orderId}/cancel`, { method: 'PATCH' })
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
    } catch (err) {
      alert('Cancel failed: ' + err.message)
    }
  }

  return (
    <div>
      <PageHeader title="Orders" description="Place and track supply orders" />

      {/* Create order button / form */}
      <div className="mb-6">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New Order
          </button>
        ) : (
          <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 max-w-lg">
            <h3 className="text-sm font-semibold text-slate-900">Create Order</h3>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Drug</label>
              <select
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                value={formDrug}
                onChange={(e) => setFormDrug(e.target.value)}
              >
                <option value="">Select drug…</option>
                {drugs.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Priority</label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Urgency</label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={formUrgency}
                  onChange={(e) => setFormUrgency(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
              <input
                type="text"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. ICU running low"
              />
            </div>

            {formError && <p className="text-xs text-rose-600">{formError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formSubmitting}
                className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {formSubmitting ? 'Creating…' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Orders list */}
      {loading && <p className="text-sm text-slate-500">Loading orders…</p>}
      {error && <p className="text-sm text-rose-600">Failed to load orders: {error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-slate-500">No orders yet. Create your first order above.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Drug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Qty</th>
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
                  <td className="px-4 py-3 text-slate-700 text-xs">
                    {o.items?.map((it) => it.drug?.name ?? '?').join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {o.items?.map((it) => it.quantity).join(', ')}
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
                    {['requested', 'approved'].includes(o.status) && (
                      <button
                        onClick={() => handleCancel(o._id)}
                        className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100"
                      >
                        Cancel
                      </button>
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