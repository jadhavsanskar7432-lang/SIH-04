import { useEffect, useState } from 'react'
import { RefreshCw, Clock, MapPin, Truck, AlertCircle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import ShipmentTracker from '../../components/supply/ShipmentTracker'
import ShipmentMap from '../../components/supply/ShipmentMap'
import EmptyState from '../../components/ui/EmptyState'
import { apiFetch } from '../../api'
import { getSocket } from '../../socket'

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed', label: 'Failed' },
]

// Real delay calculation instead of a hardcoded 0:
// - if delivered, compare deliveredAt vs expectedDelivery
// - otherwise compare now vs expectedDelivery (still in flight)
function computeDelayDays(shipment) {
  if (!shipment.expectedDelivery) return 0
  const expected = new Date(shipment.expectedDelivery)
  const reference = shipment.deliveredAt ? new Date(shipment.deliveredAt) : new Date()
  const diffMs = reference - expected
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export default function VendorShipments() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [mapId, setMapId] = useState(null)

  // State for updating a shipment status
  const [updateState, setUpdateState] = useState({}) // { [shipmentId]: { status, note, submitting } }

  // Shared fetch logic, reused by the Refresh button. The initial-mount
  // effect below has its own inline copy so the effect body only ever calls
  // a function declared directly inside it.
  async function fetchShipments() {
    try {
      const data = await apiFetch('/shipments')
      setShipments(Array.isArray(data) ? data : [])
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
        const data = await apiFetch('/shipments')
        setShipments(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Live updates: the backend emits "shipment:update" to this vendor's room
  // whenever a shipment they own is created or its status changes.
  useEffect(() => {
    const socket = getSocket()
    const onUpdate = (updated) => {
      setShipments((prev) => {
        const exists = prev.some((s) => s._id === updated._id)
        if (exists) {
          // The socket payload is the raw (unpopulated) document, so merge
          // only the fields that change status — keep populated nested
          // objects (order/batches/from/to) from the existing card intact.
          return prev.map((s) =>
            s._id === updated._id
              ? {
                  ...s,
                  status: updated.status,
                  trail: updated.trail,
                  deliveredAt: updated.deliveredAt,
                  deliveryStatus: updated.deliveryStatus,
                  dispatchedAt: updated.dispatchedAt,
                }
              : s
          )
        }
        // New shipment we don't have yet — safest is a full refetch so it
        // arrives fully populated.
        fetchShipments()
        return prev
      })
    }
    socket.on('shipment:update', onUpdate)
    return () => socket.off('shipment:update', onUpdate)
  }, [])

  function handleRefresh() {
    setLoading(true)
    fetchShipments()
  }

  async function handleStatusUpdate(shipmentId) {
    const state = updateState[shipmentId]
    if (!state?.status) return alert('Select a status first')

    setUpdateState((prev) => ({ ...prev, [shipmentId]: { ...prev[shipmentId], submitting: true } }))
    try {
      const updated = await apiFetch(`/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: state.status, note: state.note || '' }),
      })

      // updateShipmentStatus returns the raw (unpopulated) shipment, so merge
      // only the fields that changed and keep populated nested objects intact.
      setShipments((prev) =>
        prev.map((s) =>
          s._id === shipmentId
            ? { ...s, status: updated.status, trail: updated.trail, deliveredAt: updated.deliveredAt, deliveryStatus: updated.deliveryStatus }
            : s
        )
      )

      setUpdateState((prev) => ({ ...prev, [shipmentId]: { status: '', note: '', submitting: false } }))
    } catch (err) {
      alert('Update failed: ' + err.message)
      setUpdateState((prev) => ({ ...prev, [shipmentId]: { ...prev[shipmentId], submitting: false } }))
    }
  }

  const filteredShipments = filter === 'all' ? shipments : shipments.filter((s) => s.status === filter)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <PageHeader
          title="Shipments"
          description="Manage your outbound shipments and update their tracking status"
        />
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

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-72 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <div>
            <p className="text-sm font-medium text-danger-700">Failed to load shipments</p>
            <p className="mt-0.5 text-sm text-danger-600">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && filteredShipments.length === 0 && (
        <EmptyState
          icon={Truck}
          title={filter === 'all' ? 'No shipments yet' : 'No shipments in this category'}
          description={
            filter === 'all'
              ? 'Shipments you create for accepted orders will show up here.'
              : 'Try a different filter, or check back once shipment statuses change.'
          }
        />
      )}

      {!loading && !error && filteredShipments.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredShipments.map((s) => {
            const steps = ['pending', 'in_transit', 'delivered']
            let currentStep = steps.indexOf(s.status)
            if (currentStep === -1) currentStep = steps.length

            const drugName = s.batches?.[0]?.drug?.name || 'Assorted Drugs'
            const vendorName = s.from?.name || 'Unknown Vendor'
            const orderRef = s.order?._id
              ? `ORD-${s.order._id.substring(s.order._id.length - 6).toUpperCase()}`
              : 'Unknown Order'

            const isDelayedOrFailed = s.status === 'delayed' || s.status === 'failed'
            const delayDays = computeDelayDays(s)
            const isExpanded = expandedId === s._id

            return (
              <div
                key={s._id}
                className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-popover"
              >
                {isDelayedOrFailed && (
                  <div className="absolute -top-3 -right-2 z-10">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                      s.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                )}
                {s.deliveryStatus === 'late' && !isDelayedOrFailed && (
                  <div className="absolute -top-3 -right-2 z-10">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 shadow-sm">
                      DELIVERED LATE
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <ShipmentTracker
                    order={orderRef}
                    drug={drugName}
                    vendor={vendorName}
                    steps={steps}
                    currentStep={currentStep}
                    delayDays={delayDays}
                    etaOriginal={
                      s.expectedDelivery
                        ? new Date(s.expectedDelivery).toLocaleDateString()
                        : 'Unknown'
                    }
                    etaNow={
                      s.deliveredAt
                        ? new Date(s.deliveredAt).toLocaleDateString()
                        : s.expectedDelivery
                        ? new Date(s.expectedDelivery).toLocaleDateString()
                        : 'Unknown'
                    }
                  />
                </div>

                {/* Batch / trail details toggle */}
                <div className="px-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s._id)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-900 transition-colors hover:underline"
                    >
                      <Clock size={12} />
                      {isExpanded ? 'Hide history' : 'View history'}
                    </button>
                    <button
                      onClick={() => setMapId(mapId === s._id ? null : s._id)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-900 transition-colors hover:underline"
                    >
                      <MapPin size={12} />
                      {mapId === s._id ? 'Hide map' : 'Track on map'}
                    </button>
                  </div>
                  {mapId === s._id && (
                    <div className="mt-2">
                      <ShipmentMap shipment={s} />
                    </div>
                  )}
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-2.5">
                      {(s.batches || []).length > 0 && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Batches:</span>{' '}
                          {s.batches.map((b) => `${b.drug?.name || b.batchNumber} ×${b.quantity}`).join(', ')}
                        </p>
                      )}
                      {(s.trail || []).length > 0 ? (
                        <ul className="space-y-1">
                          {[...s.trail].reverse().map((t, i) => (
                            <li key={i} className="text-xs text-slate-500">
                              <span className="font-medium capitalize text-slate-700">{t.status}</span>
                              {' — '}
                              {new Date(t.timestamp).toLocaleString()}
                              {t.note ? ` · ${t.note}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">No history recorded.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Update Form */}
                {s.status !== 'delivered' && s.status !== 'failed' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 px-2 pb-2 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700">Update Status</h4>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs"
                        value={updateState[s._id]?.status || ''}
                        onChange={(e) =>
                          setUpdateState((prev) => ({
                            ...prev,
                            [s._id]: { ...prev[s._id], status: e.target.value },
                          }))
                        }
                      >
                        <option value="">Select status...</option>
                        {s.status === 'pending' && <option value="in_transit">In Transit</option>}
                        <option value="delivered">Delivered</option>
                        <option value="delayed">Delayed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add note (optional)..."
                        className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs"
                        value={updateState[s._id]?.note || ''}
                        onChange={(e) =>
                          setUpdateState((prev) => ({
                            ...prev,
                            [s._id]: { ...prev[s._id], note: e.target.value },
                          }))
                        }
                      />
                      <button
                        onClick={() => handleStatusUpdate(s._id)}
                        disabled={updateState[s._id]?.submitting || !updateState[s._id]?.status}
                        className="rounded bg-brand-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                      >
                        {updateState[s._id]?.submitting ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}