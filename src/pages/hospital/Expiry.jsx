import { useEffect, useState } from 'react'
import { apiFetch } from '../../api'
import PageHeader from '../../components/ui/PageHeader'

// Number of days from today to consider "expiring soon"
const EXPIRY_WARNING_DAYS = 30

export default function HospitalExpiry() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        // GET /api/batches returns FEFO order (ascending expiryDate) —
        // no client-side sort needed, just display in order returned
        const data = await apiFetch('/batches')
        setBatches(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBatches()
  }, [])

  // Helper: days until expiry from today (negative = already expired)
  const daysUntilExpiry = (expiryDate) => {
    const now = new Date()
    const exp = new Date(expiryDate)
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
  }

  // Row styling based on expiry urgency
  const getRowClass = (daysLeft) => {
    if (daysLeft <= 0) return 'bg-red-50'
    if (daysLeft <= EXPIRY_WARNING_DAYS) return 'bg-amber-50'
    return ''
  }

  // Badge for expiry status
  const getExpiryBadge = (daysLeft) => {
    if (daysLeft <= 0) {
      return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Expired</span>
    }
    if (daysLeft <= EXPIRY_WARNING_DAYS) {
      return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{daysLeft}d left</span>
    }
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{daysLeft}d left</span>
  }

  return (
    <div>
      <PageHeader title="Expiry Tracker" description="Monitor items nearing expiration" />

      {loading && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
          <p className="text-sm text-slate-400">Loading expiry data…</p>
        </div>
      )}

      {error && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50">
          <p className="text-sm text-red-500">Error: {error}</p>
        </div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
          <p className="text-sm text-slate-400">No batches to monitor</p>
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Legend */}
          <div className="flex gap-4 border-b border-slate-200 px-6 py-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-red-100 border border-red-200" /> Expired
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-amber-100 border border-amber-200" /> ≤ 30 days
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-200" /> Safe
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="px-6 py-3 font-medium">Drug</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Expiry Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const daysLeft = daysUntilExpiry(b.expiryDate)
                  return (
                    <tr key={b._id} className={`border-b border-slate-50 last:border-0 ${getRowClass(daysLeft)}`}>
                      <td className="px-6 py-3 text-slate-700">{b.drug?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.batchNumber}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">{getExpiryBadge(daysLeft)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">{b.quantity}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}