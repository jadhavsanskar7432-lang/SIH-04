import { useEffect, useState } from 'react'
import { Truck, Building2, MapPin } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME } from '../../theme/adminColors'
import ShipmentMap from '../../components/supply/ShipmentMap'
import { getSocket } from '../../socket'

const STEPS = ['pending', 'in_transit', 'delivered']

function ShipmentCard({ shipment: s, showMap, onToggleMap }) {
  let currentStep = STEPS.indexOf(s.status)
  if (currentStep === -1) currentStep = STEPS.length

  const drugName = s.batches?.[0]?.drug?.name || 'Assorted Drugs'
  const extraDrugs = (s.batches?.length || 0) - 1
  const vendorName = s.from?.name || 'Unknown Vendor'
  const orderRef = s.order?._id
    ? `ORD-${s.order._id.substring(s.order._id.length - 6).toUpperCase()}`
    : 'Unknown Order'

  const isDelayedOrFailed = s.status === 'delayed' || s.status === 'failed'
  const isLate = s.deliveryStatus === 'late'

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-popover">
      {(isDelayedOrFailed || isLate) && (
        <span
          className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
            s.status === 'failed' || isLate
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {s.status === 'failed' ? 'Failed' : isLate ? 'Delivered Late' : 'Delayed'}
        </span>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-400">{orderRef}</span>
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: '#F5F7ED', color: '#4F5D22' }}
        >
          <Truck size={11} />
          {s.status.replace('_', ' ')}
        </span>
      </div>

      <p className="mt-2.5 text-base font-semibold text-slate-900">
        {drugName}
        {extraDrugs > 0 && (
          <span className="ml-1 text-xs font-normal text-slate-400">
            +{extraDrugs} more
          </span>
        )}
      </p>
      <p className="flex items-center gap-1 text-xs text-slate-500">
        <Building2 size={12} />
        {vendorName}
      </p>

      {/* MINI STEPPER */}
      <ol className="mt-4 space-y-0" aria-label="Shipment status">
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <li key={step} className="relative flex items-start gap-3 pb-3 last:pb-0">
              {i < STEPS.length - 1 && (
                <span
                  className="absolute left-[5px] top-3 h-full w-px"
                  style={{ backgroundColor: done ? DARK : '#E2E8F0' }}
                />
              )}
              <span
                className="relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2"
                style={
                  done
                    ? { borderColor: DARK, backgroundColor: DARK }
                    : active
                    ? { borderColor: DARK, backgroundColor: LIME }
                    : { borderColor: '#E2E8F0', backgroundColor: 'white' }
                }
              />
              <span
                className={`text-xs capitalize leading-tight ${
                  active ? 'font-semibold text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {step.replace('_', ' ')}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>
          ETA{' '}
          {s.expectedDelivery ? new Date(s.expectedDelivery).toLocaleDateString() : 'Unknown'}
        </span>
        {s.deliveredAt && (
          <span className={isLate ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'}>
            Delivered {new Date(s.deliveredAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <button
        onClick={onToggleMap}
        className="mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
        style={{ color: DARK }}
      >
        <MapPin size={12} />
        {showMap ? 'Hide map' : 'Track on map'}
      </button>
      {showMap && (
        <div className="mt-2">
          <ShipmentMap shipment={s} />
        </div>
      )}
    </div>
  )
}

export default function HospitalShipments() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapId, setMapId] = useState(null)

  async function fetchShipments() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/shipments')
      setShipments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShipments()
  }, [])

  // Live updates: backend emits "shipment:update" to this hospital's room.
  useEffect(() => {
    const socket = getSocket()
    const onUpdate = (updated) => {
      setShipments((prev) => {
        const exists = prev.some((s) => s._id === updated._id)
        if (!exists) {
          fetchShipments()
          return prev
        }
        return prev.map((s) =>
          s._id === updated._id
            ? {
                ...s,
                status: updated.status,
                trail: updated.trail,
                deliveredAt: updated.deliveredAt,
                deliveryStatus: updated.deliveryStatus,
              }
            : s
        )
      })
    }
    socket.on('shipment:update', onUpdate)
    return () => socket.off('shipment:update', onUpdate)
  }, [])

  const activeCount = shipments.filter((s) =>
    ['pending', 'in_transit', 'delayed'].includes(s.status)
  ).length

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Logistics</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Shipments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track incoming deliveries for your hospital · {activeCount} active
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading shipments...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Could not load shipments</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && shipments.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <Truck size={28} className="mb-2 text-slate-300" />
          No incoming shipments found.
        </div>
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shipments.map((s) => (
            <ShipmentCard
              key={s._id}
              shipment={s}
              showMap={mapId === s._id}
              onToggleMap={() => setMapId(mapId === s._id ? null : s._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
