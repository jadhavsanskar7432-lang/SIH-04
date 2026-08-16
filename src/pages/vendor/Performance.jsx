import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import ShipmentTracker from '../../components/supply/ShipmentTracker'
import { apiFetch } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { TrendingUp, MapPin, Phone, Building } from 'lucide-react'

export default function VendorPerformance() {
  const { user } = useAuth()
  const [vendorData, setVendorData] = useState(null)
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const id = user?._id || user?.id
        if (!id) throw new Error("No user ID found")
        const vData = await apiFetch(`/vendors/${id}`)
        setVendorData(vData)

        try {
          const sData = await apiFetch('/shipments')
          setShipments(Array.isArray(sData) ? sData : [])
        } catch (err) {
          // It's okay if shipments fail, we still show performance
          console.error("Failed to load shipments:", err)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  return (
    <div>
      <PageHeader
        title="Performance"
        description="Review delivery performance metrics and recent shipments"
      />
      {loading && <p className="text-sm text-slate-500">Loading performance data...</p>}
      {error && <p className="text-sm text-rose-600">Failed to load performance data: {error}</p>}
      {!loading && !error && vendorData && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard label="Vendor Name" value={vendorData.name} icon={Building} accent="indigo" />
            <StatCard label="Location" value={vendorData.location || '-'} icon={MapPin} accent="amber" />
            <StatCard label="Contact" value={vendorData.contact || '-'} icon={Phone} accent="emerald" />
            <StatCard label="Reliability Score" value={`${vendorData.reliabilityScore}%`} icon={TrendingUp} accent="rose" />
          </div>

          <h3 className="text-lg font-medium text-slate-900 mb-4">Recent Shipments</h3>
          {shipments.length === 0 ? (
            <p className="text-sm text-slate-500">No shipments found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.map((s) => {
                const steps = ['pending', 'in_transit', 'delivered']
                let currentStep = steps.indexOf(s.status)
                if (currentStep === -1) currentStep = steps.length
                
                const drugName = s.batches?.[0]?.drug?.name || 'Assorted Drugs'
                
                return (
                  <ShipmentTracker
                    key={s._id}
                    order={s.order?._id ? `ORD-${s.order._id.substring(s.order._id.length - 6).toUpperCase()}` : 'Unknown Order'}
                    drug={drugName}
                    vendor={vendorData.name}
                    steps={steps}
                    currentStep={currentStep}
                    delayDays={0}
                    etaOriginal={new Date(s.expectedDeliveryDate || Date.now()).toLocaleDateString()}
                    etaNow={new Date(s.expectedDeliveryDate || Date.now()).toLocaleDateString()}
                  />
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}