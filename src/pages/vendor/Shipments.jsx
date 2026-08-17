import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import ShipmentTracker from '../../components/supply/ShipmentTracker'
import { apiFetch } from '../../api'

export default function VendorShipments() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // State for updating a shipment status
  const [updateState, setUpdateState] = useState({}) // { [shipmentId]: { status, note, submitting } }

  useEffect(() => {
    async function fetchShipments() {
      try {
        const data = await apiFetch('/shipments')
        setShipments(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchShipments()
  }, [])

  async function handleStatusUpdate(shipmentId) {
    const state = updateState[shipmentId]
    if (!state?.status) return alert('Select a status first')

    setUpdateState((prev) => ({ ...prev, [shipmentId]: { ...prev[shipmentId], submitting: true } }))
    try {
      const updated = await apiFetch(`/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: state.status, note: state.note || '' }),
      })
      
      // Update local state by replacing the old shipment with the new one
      // If the API doesn't populate 'from'/'to' on PATCH, we might lose nested data,
      // but assuming the backend returns the updated populated document, it should be fine.
      // Wait, updateShipmentStatus controller returns just the shipment, not repopulated.
      // So we merge the fields to keep populated nested objects like `order`, `batches`, `from`, `to` intact.
      setShipments((prev) => prev.map((s) => (s._id === shipmentId ? { ...s, status: updated.status, trail: updated.trail, deliveredAt: updated.deliveredAt, deliveryStatus: updated.deliveryStatus } : s)))
      
      // Clear form
      setUpdateState((prev) => ({ ...prev, [shipmentId]: { status: '', note: '', submitting: false } }))
    } catch (err) {
      alert('Update failed: ' + err.message)
      setUpdateState((prev) => ({ ...prev, [shipmentId]: { ...prev[shipmentId], submitting: false } }))
    }
  }

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Manage your outbound shipments and update their tracking status"
      />

      {loading && <p className="text-sm text-slate-500">Loading shipments...</p>}
      {error && <p className="text-sm text-rose-600">Failed to load shipments: {error}</p>}
      {!loading && !error && shipments.length === 0 && (
        <p className="text-sm text-slate-500">No active shipments found.</p>
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {shipments.map((s) => {
            const steps = ['pending', 'in_transit', 'delivered']
            let currentStep = steps.indexOf(s.status)
            if (currentStep === -1) currentStep = steps.length

            const drugName = s.batches?.[0]?.drug?.name || 'Assorted Drugs'
            const vendorName = s.from?.name || 'Unknown Vendor'
            const orderRef = s.order?._id
              ? `ORD-${s.order._id.substring(s.order._id.length - 6).toUpperCase()}`
              : 'Unknown Order'
              
            const isDelayedOrFailed = s.status === 'delayed' || s.status === 'failed'

            return (
              <div key={s._id} className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex flex-col">
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
                    delayDays={0}
                    etaOriginal={
                      s.expectedDelivery
                        ? new Date(s.expectedDelivery).toLocaleDateString()
                        : 'Unknown'
                    }
                    etaNow={
                      s.expectedDelivery
                        ? new Date(s.expectedDelivery).toLocaleDateString()
                        : 'Unknown'
                    }
                  />
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
                        className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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