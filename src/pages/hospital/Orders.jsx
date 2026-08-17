import { useEffect, useState } from 'react'
import { Plus, X, ShoppingCart, Building2 } from 'lucide-react'
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

export default function HospitalOrders() {
  const [orders, setOrders] = useState([])
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [formDrug, setFormDrug] = useState('')
  const [formQty, setFormQty] = useState(10)
  const [formPriority, setFormPriority] = useState('medium')
  const [formUrgency, setFormUrgency] = useState('normal')
  const [formNotes, setFormNotes] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
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

  useEffect(() => {
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

  const activeCount = orders.filter((o) =>
    ['requested', 'approved', 'accepted', 'dispatched'].includes(o.status)
  ).length

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Procurement</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Place and track supply orders · {activeCount} active
          </p>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: LIME, color: LIME_TEXT }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Order'}
        </button>
      </div>

      {/* CREATE ORDER FORM */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-base font-semibold text-slate-900">Create Order</h3>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Drug</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
              value={formDrug}
              onChange={(e) => setFormDrug(e.target.value)}
            >
              <option value="">Select drug…</option>
              {drugs.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Quantity</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
              value={formQty}
              onChange={(e) => setFormQty(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Priority</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Urgency</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
                value={formUrgency}
                onChange={(e) => setFormUrgency(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Notes (optional)</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. ICU running low"
            />
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}

          <button
            type="submit"
            disabled={formSubmitting}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ backgroundColor: DARK, color: 'white' }}
          >
            {formSubmitting ? 'Creating…' : 'Create Order'}
          </button>
        </form>
      )}

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
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <ShoppingCart size={28} className="mb-2 text-slate-300" />
          No orders yet. Create your first order above.
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      #{o._id.substring(o._id.length - 6).toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_COLORS[o.status] || ''
                      }`}
                    >
                      {o.status}
                    </span>
                    {o.urgency === 'urgent' && (
                      <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.items?.map((it, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {it.drug?.name ?? 'Unknown'} × {it.quantity}
                      </span>
                    ))}
                  </div>

                  {o.vendor?.name && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 size={12} />
                      Assigned vendor: {o.vendor.name}
                    </p>
                  )}

                  {o.notes && <p className="mt-1 text-xs text-slate-400">"{o.notes}"</p>}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs capitalize text-slate-400">{o.priority} priority</span>
                  {['requested', 'approved'].includes(o.status) && (
                    <button
                      onClick={() => handleCancel(o._id)}
                      className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
