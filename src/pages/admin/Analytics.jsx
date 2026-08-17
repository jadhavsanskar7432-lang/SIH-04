import { useEffect, useState } from 'react'
import { apiFetch } from '../../api'



function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    healthy: 'bg-green-50 text-green-700',
    low: 'bg-yellow-50 text-yellow-700',
    critical: 'bg-red-50 text-red-700',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || 'bg-slate-50 text-slate-600'
        }`}
    >
      {status}
    </span>
  )
}

function Bar({ label, value, max, suffix = '' }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 2

  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">
          {value}
          {suffix}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalytics = async (selectedPeriod) => {
    try {
      setLoading(true)
      setError('')

      const data = await apiFetch(
        `/insights/analytics?period=${selectedPeriod}`
      )

      setAnalytics(data)
    } catch (err) {
      console.error('Analytics error:', err)
      setError(err.message || 'Could not load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(period)
  }, [period])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-slate-500">
            Supply chain insights and reporting
          </p>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading analytics...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-slate-500">
            Supply chain insights and reporting
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Could not load analytics
          </h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>

          <button
            onClick={() => fetchAnalytics(period)}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const {
    overview,
    orders,
    shipments,
    consumption,
    inventory,
    vendors,
  } = analytics

  const orderStatuses = Object.entries(orders.byStatus || {})
  const shipmentStatuses = Object.entries(shipments.byStatus || {})

  const maxOrderValue = Math.max(
    ...orderStatuses.map(([, value]) => value),
    1
  )

  const maxShipmentValue = Math.max(
    ...shipmentStatuses.map(([, value]) => value),
    1
  )

  const maxConsumption = Math.max(
    ...(consumption.dailyTrend || []).map(
      (item) => item.quantityConsumed
    ),
    1
  )

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Analytics
          </h1>
          <p className="mt-1 text-slate-500">
            Supply chain insights and reporting
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Drugs"
          value={overview.totalDrugs}
        />

        <StatCard
          title="Total Stock"
          value={overview.totalStock.toLocaleString()}
          subtitle="Units currently in stock"
        />

        <StatCard
          title="Low Stock"
          value={overview.lowStockDrugs}
          subtitle="Needs replenishment"
        />

        <StatCard
          title="Critical Stock"
          value={overview.criticalStockDrugs}
          subtitle="Immediate attention"
        />

        <StatCard
          title="Hospitals"
          value={overview.totalHospitals}
        />

        <StatCard
          title="Vendors"
          value={overview.totalVendors}
        />
      </div>

      {/* ORDERS + SHIPMENTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ORDERS */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Order Analytics
            </h2>
            <p className="text-sm text-slate-500">
              {orders.total} total orders in selected period
            </p>
          </div>

          {orderStatuses.map(([status, value]) => (
            <Bar
              key={status}
              label={status.replace('_', ' ')}
              value={value}
              max={maxOrderValue}
            />
          ))}

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Urgent</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {orders.byUrgency?.urgent || 0}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Normal</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {orders.byUrgency?.normal || 0}
              </p>
            </div>
          </div>
        </div>

        {/* SHIPMENTS */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Shipment Performance
              </h2>
              <p className="text-sm text-slate-500">
                {shipments.total} total shipments
              </p>
            </div>

            <div className="rounded-lg bg-indigo-50 px-4 py-2 text-right">
              <p className="text-xs text-indigo-500">
                On-time rate
              </p>
              <p className="text-xl font-bold text-indigo-700">
                {shipments.deliveryPerformance !== null
                  ? `${shipments.deliveryPerformance}%`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {shipmentStatuses.map(([status, value]) => (
            <Bar
              key={status}
              label={status.replace('_', ' ')}
              value={value}
              max={maxShipmentValue}
            />
          ))}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-green-600">On Time</p>
              <p className="mt-1 text-xl font-bold text-green-700">
                {shipments.onTime}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs text-red-600">Late</p>
              <p className="mt-1 text-xl font-bold text-red-700">
                {shipments.late}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONSUMPTION TREND */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Consumption Trend
          </h2>
          <p className="text-sm text-slate-500">
            Daily medicine consumption
          </p>
        </div>

        {consumption.dailyTrend?.length > 0 ? (
          <div className="flex h-64 items-end gap-1 overflow-x-auto border-b border-slate-200 pb-1">
            {consumption.dailyTrend.map((item) => {
              const height =
                (item.quantityConsumed / maxConsumption) * 100

              return (
                <div
                  key={item.date}
                  className="group flex min-w-[12px] flex-1 flex-col items-center justify-end"
                >
                  <div className="pointer-events-none mb-1 hidden rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
                    {item.quantityConsumed} units
                  </div>

                  <div
                    className="w-full min-w-[8px] rounded-t bg-indigo-500 transition hover:bg-indigo-600"
                    style={{
                      height: `${Math.max(height, 3)}%`,
                    }}
                  />

                  <span className="mt-2 hidden text-[10px] text-slate-400 lg:block">
                    {item.date.slice(5)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            No consumption data for this period.
          </div>
        )}

        <div className="mt-5 flex justify-between">
          <span className="text-sm text-slate-500">
            Total consumed
          </span>
          <span className="font-bold text-slate-900">
            {consumption.totalConsumed.toLocaleString()} units
          </span>
        </div>
      </div>

      {/* TOP DRUGS + INVENTORY */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* TOP CONSUMED */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Top Consumed Drugs
          </h2>

          <div className="mt-5 space-y-4">
            {consumption.topDrugs?.length > 0 ? (
              consumption.topDrugs.map((item, index) => (
                <div
                  key={item.drug?._id || index}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {item.drug?.name || 'Unknown Drug'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.drug?.genericName || ''}
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-slate-800">
                    {item.quantityConsumed.toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No consumption data available.
              </p>
            )}
          </div>
        </div>

        {/* INVENTORY */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory Status
            </h2>
            <p className="text-sm text-slate-500">
              Current stock by drug
            </p>
          </div>

          <div className="max-h-[430px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-medium text-slate-500">
                    Drug
                  </th>
                  <th className="pb-3 font-medium text-slate-500">
                    Stock
                  </th>
                  <th className="pb-3 font-medium text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {inventory.byDrug?.map((drug) => (
                  <tr
                    key={drug.drugId}
                    className="border-b border-slate-100"
                  >
                    <td className="py-3">
                      <p className="font-medium text-slate-800">
                        {drug.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {drug.category || 'Uncategorized'}
                      </p>
                    </td>

                    <td className="py-3 font-semibold text-slate-800">
                      {drug.currentStock.toLocaleString()}
                    </td>

                    <td className="py-3">
                      <StatusBadge status={drug.stockStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EXPIRING BATCHES */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Expiring Batches
          </h2>
          <p className="text-sm text-slate-500">
            Batches expiring within the next 30 days
          </p>
        </div>

        {inventory.expiringSoon?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-medium text-slate-500">
                    Batch
                  </th>
                  <th className="pb-3 font-medium text-slate-500">
                    Drug
                  </th>
                  <th className="pb-3 font-medium text-slate-500">
                    Quantity
                  </th>
                  <th className="pb-3 font-medium text-slate-500">
                    Expiry
                  </th>
                  <th className="pb-3 font-medium text-slate-500">
                    Location
                  </th>
                </tr>
              </thead>

              <tbody>
                {inventory.expiringSoon.map((batch) => (
                  <tr
                    key={batch.batchId}
                    className="border-b border-slate-100"
                  >
                    <td className="py-3 font-medium text-slate-800">
                      {batch.batchNumber}
                    </td>

                    <td className="py-3 text-slate-700">
                      {batch.drug?.name || 'Unknown'}
                    </td>

                    <td className="py-3 text-slate-700">
                      {batch.quantity}
                    </td>

                    <td className="py-3 font-medium text-orange-600">
                      {new Date(
                        batch.expiryDate
                      ).toLocaleDateString()}
                    </td>

                    <td className="py-3 text-slate-600">
                      {batch.currentLocation?.name || 'In transit'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg bg-green-50 p-5 text-center text-sm text-green-700">
            No batches are expiring within the next 30 days.
          </div>
        )}
      </div>

      {/* VENDOR PERFORMANCE */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Vendor Performance
            </h2>
            <p className="text-sm text-slate-500">
              Reliability and shipment performance
            </p>
          </div>

          <div className="rounded-lg bg-indigo-50 px-4 py-2">
            <span className="text-xs text-indigo-500">
              Average reliability
            </span>
            <p className="text-xl font-bold text-indigo-700">
              {vendors.averageReliability}%
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-medium text-slate-500">
                  Vendor
                </th>
                <th className="pb-3 font-medium text-slate-500">
                  Reliability
                </th>
                <th className="pb-3 font-medium text-slate-500">
                  Shipments
                </th>
                <th className="pb-3 font-medium text-slate-500">
                  Delivered
                </th>
                <th className="pb-3 font-medium text-slate-500">
                  On Time
                </th>
                <th className="pb-3 font-medium text-slate-500">
                  Late
                </th>
                <th className="pb-3 font-medium text-slate-500">
                  Failed
                </th>
                <th className="pb-3 font-medium text-slate-500">
                  On-time %
                </th>
              </tr>
            </thead>

            <tbody>
              {vendors.performance?.map((item) => (
                <tr
                  key={item.vendor?._id}
                  className="border-b border-slate-100"
                >
                  <td className="py-3 font-medium text-slate-800">
                    {item.vendor?.name || 'Unknown'}
                  </td>

                  <td className="py-3 font-semibold">
                    {item.reliabilityScore}%
                  </td>

                  <td className="py-3">
                    {item.totalShipments}
                  </td>

                  <td className="py-3">
                    {item.delivered}
                  </td>

                  <td className="py-3 text-green-600">
                    {item.onTime}
                  </td>

                  <td className="py-3 text-orange-600">
                    {item.late}
                  </td>

                  <td className="py-3 text-red-600">
                    {item.failed}
                  </td>

                  <td className="py-3 font-semibold">
                    {item.onTimePercentage !== null
                      ? `${item.onTimePercentage}%`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HOSPITAL STOCK */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Hospital Inventory
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current stock held by each hospital
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {inventory.byHospital?.length > 0 ? (
            inventory.byHospital.map((item) => (
              <div
                key={item.hospital?._id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-medium text-slate-800">
                  {item.hospital?.name || 'Unknown Hospital'}
                </p>

                <p className="mt-1 text-2xl font-bold text-indigo-600">
                  {item.totalStock.toLocaleString()}
                </p>

                <p className="text-xs text-slate-500">
                  units in stock
                </p>
              </div>
            ))
          ) : (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">
              No hospital inventory data available.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}