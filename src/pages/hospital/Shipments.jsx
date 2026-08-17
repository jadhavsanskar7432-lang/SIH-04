import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import ShipmentTracker from '../../components/supply/ShipmentTracker'
import { apiFetch } from '../../api'

export default function HospitalShipments() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Track incoming deliveries for your hospital"
      />

      {loading && <p className="text-sm text-slate-500">Loading shipments...</p>}
      {error && <p className="text-sm text-rose-600">Failed to load shipments: {error}</p>}
      {!loading && !error && shipments.length === 0 && (
        <p className="text-sm text-slate-500">No incoming shipments found.</p>
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
              <div key={s._id} className="relative">
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
            )
          })}
        </div>
      )}
    </div>
  )
}