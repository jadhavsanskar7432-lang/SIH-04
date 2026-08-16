import PageHeader from '../../components/ui/PageHeader'
import ShipmentTracker from '../../components/supply/ShipmentTracker'
import { useApp } from '../../context/AppContext'

export default function AdminShipments() {
  const { shipments, orders, drugs, vendors, shipmentSteps } = useApp()

  return (
    <div>
      <PageHeader
        eyebrow="Shipments"
        title="Every shipment, live"
        description="A delay on any one of these re-checks whether the destination hospital is still on track."
      />

      <div className="flex flex-wrap gap-6">
        {shipments.map((s) => {
          const order = orders.find((o) => o.id === s.orderId)
          const drug = drugs.find((d) => d.id === order?.drugId)
          const vendor = vendors.find((v) => v.id === order?.vendorId)
          return (
            <ShipmentTracker
              key={s.id}
              order={s.id}
              drug={drug?.name}
              vendor={vendor?.name ?? 'Vendor pending'}
              steps={shipmentSteps}
              currentStep={s.currentStep}
              delayDays={s.delayDays}
              etaOriginal={s.etaOriginal}
              etaNow={s.etaNow}
            />
          )
        })}
        {shipments.length === 0 && (
          <p className="text-sm text-ink-faint">No shipments in the system yet.</p>
        )}
      </div>
    </div>
  )
}