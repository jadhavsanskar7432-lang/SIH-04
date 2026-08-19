import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, PackagePlus, ChevronRight, ShoppingCart, AlertCircle, Building2, Zap } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { SkeletonStatCards } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import OrderStepper from '../../components/ui/OrderStepper'
import { apiFetch } from '../../api'
import { getSocket } from '../../socket'
import { LIME } from '../../theme/adminColors'

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Awaiting Accept' },
  { key: 'accepted', label: 'Ready to Ship' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const [rejectReason, setRejectReason] = useState({}) // { [orderId]: string }

  const [shipOrderId, setShipOrderId] = useState(null)
  const [shipForm, setShipForm] = useState({ batches: [], expectedDelivery: '' })
  const [shipSubmitting, setShipSubmitting] = useState(false)
  const [shipError, setShipError] = useState(null)

  async function loadAll() {
    try {
      const [orderData, batchData] = await Promise.all([
        apiFetch('/orders'),
        apiFetch('/batches?status=in_stock'),
      ])
      setOrders(Array.isArray(orderData) ? orderData : [])
      setBatches(Array.isArray(batchData) ? batchData : [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const [orderData, batchData] = await Promise.all([
          apiFetch('/orders'),
          apiFetch('/batches?status=in_stock'),
        ])
        setOrders(Array.isArray(orderData) ? orderData : [])
        setBatches(Array.isArray(batchData) ? batchData : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    const onUpdate = async () => {
      try {
        const data = await apiFetch('/orders')
        setOrders(Array.isArray(data) ? data : [])
      } catch {
        // ignore transient refetch errors
      }
    }
    socket.on('order:update', onUpdate)
    return () => socket.off('order:update', onUpdate)
  }, [])

  function handleRefresh() {
    setLoading(true)
    loadAll()
  }

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

  function openShipPanel(order) {
    setShipOrderId(order._id)
    setShipForm({ batches: [], expectedDelivery: '' })
    setShipError(null)
  }

  function closeShipPanel() {
    setShipOrderId(null)
    setShipForm({ batches: [], expectedDelivery: '' })
    setShipError(null)
  }

  function toggleBatch(batchId) {
    setShipForm((prev) => {
      const exists = prev.batches.includes(batchId)
      return {
        ...prev,
        batches: exists ? prev.batches.filter((id) => id !== batchId) : [...prev.batches, batchId],
      }
    })
  }

  async function handleCreateShipment(order) {
    if (shipForm.batches.length === 0) {
      setShipError('Select at least one batch to ship.')
      return
    }
    setShipSubmitting(true)
    setShipError(null)
    try {
      await apiFetch('/shipments', {
        method: 'POST',
        body: JSON.stringify({
          order: order._id,
          batches: shipForm.batches,
          expectedDelivery: shipForm.expectedDelivery || undefined,
        }),
      })
      await loadAll()
      closeShipPanel()
    } catch (err) {
      setShipError(err.message)
    } finally {
      setShipSubmitting(false)
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <PageHeader title="Orders" description="View and manage incoming orders assigned to you" />
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              filter === tab.key
                ? 'bg-brand-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonStatCards count={2} />}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <div>
            <p className="text-sm font-medium text-danger-700">Failed to load orders</p>
            <p className="mt-0.5 text-sm text-danger-600">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title={filter === 'all' ? 'No orders yet' : 'No orders in this category'}
          description={
            filter === 'all'
              ? 'Orders a hospital places with you will show up here once approved by admin.'
              : 'Try a different filter, or check back once order statuses change.'
          }
        />
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const orderDrugIds = new Set((o.items || []).map((it) => it.drug?._id).filter(Boolean))
            const eligibleBatches = batches.filter((b) => orderDrugIds.has(b.drug?._id))
            const panelOpen = shipOrderId === o._id

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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-500">
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
                    </div>

                    <div className="w-full sm:w-auto sm:min-w-[260px]">
                      <OrderStepper status={o.status} />
                    </div>
                  </div>

                  {/* ACTIONS */}
                  {o.status === 'approved' && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => handleAccept(o._id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        Accept
                      </button>
                      <input
                        type="text"
                        placeholder="Reason for rejecting…"
                        className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-[#12281F]"
                        value={rejectReason[o._id] || ''}
                        onChange={(e) =>
                          setRejectReason((prev) => ({ ...prev, [o._id]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => handleReject(o._id)}
                        className="rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-100"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {o.status === 'accepted' && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => (panelOpen ? closeShipPanel() : openShipPanel(o))}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                      >
                        <PackagePlus size={14} />
                        {panelOpen ? 'Close' : 'Create Shipment'}
                      </button>
                    </div>
                  )}

                  {o.status === 'dispatched' && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <Link
                        to="/vendor/shipments"
                        className="flex w-fit items-center gap-1 text-xs font-semibold text-brand-900 transition-colors hover:underline"
                      >
                        Track shipment <ChevronRight size={12} />
                      </Link>
                    </div>
                  )}

                  {/* CREATE SHIPMENT PANEL — expands inline within the card */}
                  {panelOpen && (
                    <div className="mt-4 rounded-xl border border-accent-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Create shipment for #{o._id.substring(o._id.length - 6).toUpperCase()}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Select which in-stock batches to send. Needed:{' '}
                        {o.items?.map((it) => `${it.drug?.name ?? '?'} ×${it.quantity}`).join(', ')}
                      </p>

                      {eligibleBatches.length === 0 ? (
                        <p className="mt-3 text-xs text-danger-600">
                          No matching in-stock batches found for these drugs. Add stock via batch creation before shipping.
                        </p>
                      ) : (
                        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-2 py-1.5 text-left"></th>
                                <th className="px-2 py-1.5 text-left font-medium text-slate-500">Batch #</th>
                                <th className="px-2 py-1.5 text-left font-medium text-slate-500">Drug</th>
                                <th className="px-2 py-1.5 text-left font-medium text-slate-500">Qty</th>
                                <th className="px-2 py-1.5 text-left font-medium text-slate-500">Expiry</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {eligibleBatches.map((b) => (
                                <tr key={b._id}>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="checkbox"
                                      checked={shipForm.batches.includes(b._id)}
                                      onChange={() => toggleBatch(b._id)}
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 font-mono">{b.batchNumber}</td>
                                  <td className="px-2 py-1.5">{b.drug?.name}</td>
                                  <td className="px-2 py-1.5">{b.quantity} {b.drug?.unit || 'units'}</td>
                                  <td className="px-2 py-1.5">{new Date(b.expiryDate).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-end gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600">Expected delivery</label>
                          <input
                            type="date"
                            className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-[#12281F]"
                            value={shipForm.expectedDelivery}
                            onChange={(e) =>
                              setShipForm((prev) => ({ ...prev, expectedDelivery: e.target.value }))
                            }
                          />
                        </div>
                        <button
                          onClick={() => handleCreateShipment(o)}
                          disabled={shipSubmitting}
                          className="rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                        >
                          {shipSubmitting ? 'Creating…' : 'Dispatch Shipment'}
                        </button>
                        <button
                          onClick={closeShipPanel}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                      {shipError && <p className="mt-2 text-xs text-danger-600">{shipError}</p>}
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
