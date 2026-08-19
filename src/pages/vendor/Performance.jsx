import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import ShipmentTracker from '../../components/supply/ShipmentTracker'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonStatCards } from '../../components/ui/Skeleton'
import { apiFetch } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { TrendingUp, PackageCheck, Timer, AlertTriangle, RefreshCw, Building2, MapPin, Truck, AlertCircle } from 'lucide-react'

function computeDelayDays(shipment) {
  if (!shipment.expectedDelivery) return 0
  const expected = new Date(shipment.expectedDelivery)
  const reference = shipment.deliveredAt ? new Date(shipment.deliveredAt) : new Date()
  const diffMs = reference - expected
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export default function VendorPerformance() {
  const { user } = useAuth()
  const [vendorData, setVendorData] = useState(null)
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Shared fetch logic, reused by the Refresh button. The initial-mount
  // effect below has its own inline copy so the effect body only ever calls
  // a function declared directly inside it.
  async function fetchData() {
    try {
      const id = user?._id || user?.id
      if (!id) throw new Error('No user ID found')
      const vData = await apiFetch(`/vendors/${id}`)
      setVendorData(vData)
      setError(null)

      try {
        const sData = await apiFetch('/shipments')
        setShipments(Array.isArray(sData) ? sData : [])
      } catch (err) {
        // It's okay if shipments fail, we still show performance
        console.error('Failed to load shipments:', err)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const id = user?._id || user?.id
        if (!id) throw new Error('No user ID found')
        const vData = await apiFetch(`/vendors/${id}`)
        setVendorData(vData)

        try {
          const sData = await apiFetch('/shipments')
          setShipments(Array.isArray(sData) ? sData : [])
        } catch (err) {
          console.error('Failed to load shipments:', err)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user])

  function handleRefresh() {
    setLoading(true)
    fetchData()
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <PageHeader
          title="Performance"
          description="Review delivery performance metrics and recent shipments"
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

      {loading && (
        <div className="space-y-6">
          <div className="skeleton h-16 rounded-2xl" />
          <SkeletonStatCards count={4} />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <div>
            <p className="text-sm font-medium text-danger-700">Failed to load performance data</p>
            <p className="mt-0.5 text-sm text-danger-600">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && vendorData && (() => {
        const delivered = shipments.filter((s) => s.status === 'delivered')
        const delayed = shipments.filter((s) => s.status === 'delayed')
        const failed = shipments.filter((s) => s.status === 'failed')
        const onTimeDelivered = delivered.filter((s) => s.deliveryStatus === 'on_time')
        const onTimeRate = delivered.length > 0
          ? Math.round((onTimeDelivered.length / delivered.length) * 100)
          : null

        const recentShipments = [...shipments]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6)

        return (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-900">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{vendorData.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={11} />
                  {vendorData.location || 'Location not set'}
                  {vendorData.contact ? ` · ${vendorData.contact}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard label="Reliability Score" value={`${vendorData.reliabilityScore}%`} icon={TrendingUp} accent="indigo" />
              <StatCard
                label="On-Time Delivery Rate"
                value={onTimeRate != null ? `${onTimeRate}%` : '—'}
                icon={Timer}
                accent="emerald"
              />
              <StatCard label="Total Delivered" value={delivered.length} icon={PackageCheck} accent="amber" />
              <StatCard label="Delayed / Failed" value={delayed.length + failed.length} icon={AlertTriangle} accent="rose" />
            </div>

            <h3 className="mb-4 text-base font-semibold text-slate-900">Recent Shipments</h3>
            {recentShipments.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No shipments yet"
                description="Shipments you dispatch will show up here with live tracking."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentShipments.map((s) => {
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
                      delayDays={computeDelayDays(s)}
                      etaOriginal={s.expectedDelivery ? new Date(s.expectedDelivery).toLocaleDateString() : 'Unknown'}
                      etaNow={
                        s.deliveredAt
                          ? new Date(s.deliveredAt).toLocaleDateString()
                          : s.expectedDelivery
                          ? new Date(s.expectedDelivery).toLocaleDateString()
                          : 'Unknown'
                      }
                    />
                  )
                })}
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}