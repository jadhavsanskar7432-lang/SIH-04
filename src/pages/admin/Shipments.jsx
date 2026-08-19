import { useEffect, useState } from 'react'
import { MapPin, Truck, AlertCircle, ArrowRightCircle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import ShipmentTracker from '../../components/supply/ShipmentTracker'
import ShipmentMap from '../../components/supply/ShipmentMap'
import EmptyState from '../../components/ui/EmptyState'
import { apiFetch } from '../../api'
import { getSocket } from '../../socket'
import { DARK } from '../../theme/adminColors'

const NEXT_STATUS = { pending: 'in_transit', in_transit: 'delivered' }
const NEXT_LABEL = { pending: 'Mark In Transit', in_transit: 'Mark Delivered' }

function computeDelayDays(shipment) {
  if (!shipment.expectedDelivery) return 0
  const expected = new Date(shipment.expectedDelivery)
  const reference = shipment.deliveredAt ? new Date(shipment.deliveredAt) : new Date()
  const diffDays = Math.ceil((reference - expected) / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export default function AdminShipments() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapId, setMapId] = useState(null)
  const [advancing, setAdvancing] = useState(null) // shipment _id currently being advanced

  async function handleAdvance(shipment) {
    const next = NEXT_STATUS[shipment.status]
    if (!next) return
    setAdvancing(shipment._id)
    try {
      const updated = await apiFetch(`/shipments/${shipment._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      setShipments((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))
    } catch (err) {
      alert('Could not update shipment: ' + err.message)
    } finally {
      setAdvancing(null)
    }
  }

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

  // Live updates: admin sees every shipment, and the backend emits
  // "shipment:update" to both the vendor and hospital rooms involved — since
  // admin isn't in either room, do a light refetch on change instead.
  useEffect(() => {
    const socket = getSocket()
    const onUpdate = async () => {
      try {
        const data = await apiFetch('/shipments')
        setShipments(data)
      } catch {
        // ignore transient refetch errors
      }
    }
    socket.on('shipment:update', onUpdate)
    return () => socket.off('shipment:update', onUpdate)
  }, [])

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Monitor shipment status and logistics across the network"
      />

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

      {!loading && !error && shipments.length === 0 && (
        <EmptyState
          icon={Truck}
          title="No shipments yet"
          description="Shipments dispatched by vendors across the network will show up here."
        />
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {shipments.map((s) => {
            const steps = ['pending', 'in_transit', 'delivered']
            let currentStep = steps.indexOf(s.status)
            if (currentStep === -1) currentStep = steps.length

            const drugName = s.batches?.[0]?.drug?.name || 'Assorted Drugs'
            const isRedistribution = s.from?.role === 'hospital'
            const originName = s.from?.name || (isRedistribution ? 'Unknown Hospital' : 'Unknown Vendor')
            const orderRef = s.order?._id
              ? `ORD-${s.order._id.substring(s.order._id.length - 6).toUpperCase()}`
              : isRedistribution
              ? 'REDISTRIBUTION'
              : 'Unknown Order'

            const isDelayedOrFailed = s.status === 'delayed' || s.status === 'failed'

            return (
              <div
                key={s._id}
                className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-popover"
              >
                {isDelayedOrFailed && (
                  <div className="absolute -top-3 -right-2 z-10">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                      s.status === 'failed' ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                )}
                {s.deliveryStatus === 'late' && !isDelayedOrFailed && (
                  <div className="absolute -top-3 -right-2 z-10">
                    <span className="inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-semibold text-danger-700 shadow-sm">
                      DELIVERED LATE
                    </span>
                  </div>
                )}
                {isRedistribution && (
                  <div className="absolute -top-3 left-2 z-10">
                    <span className="inline-flex items-center rounded-full bg-accent-200 px-2.5 py-0.5 text-xs font-semibold text-brand-900 shadow-sm">
                      REDISTRIBUTION
                    </span>
                  </div>
                )}
                <ShipmentTracker
                  order={orderRef}
                  drug={drugName}
                  vendor={originName}
                  steps={steps}
                  currentStep={currentStep}
                  delayDays={computeDelayDays(s)}
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
                {isRedistribution && NEXT_STATUS[s.status] && (
                  <button
                    onClick={() => handleAdvance(s)}
                    disabled={advancing === s._id}
                    className="mx-2 mb-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: DARK }}
                  >
                    <ArrowRightCircle size={13} />
                    {advancing === s._id ? 'Updating…' : NEXT_LABEL[s.status]}
                  </button>
                )}
                <button
                  onClick={() => setMapId(mapId === s._id ? null : s._id)}
                  className="mt-2 flex items-center gap-1 px-2 pb-2 text-xs font-medium text-brand-900 transition-colors hover:underline"
                >
                  <MapPin size={12} />
                  {mapId === s._id ? 'Hide map' : 'Track on map'}
                </button>
                {mapId === s._id && (
                  <div className="px-2 pb-2">
                    <ShipmentMap shipment={s} />
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