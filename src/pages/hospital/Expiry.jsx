import { useEffect, useState } from 'react'
import { CalendarClock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK } from '../../theme/adminColors'

const EXPIRY_WARNING_DAYS = 30

function daysUntilExpiry(expiryDate) {
  const now = new Date()
  const exp = new Date(expiryDate)
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
}

function getExpiryBadge(daysLeft) {
  if (daysLeft <= 0) {
    return (
      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
        Expired
      </span>
    )
  }
  if (daysLeft <= EXPIRY_WARNING_DAYS) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        {daysLeft}d left
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      {daysLeft}d left
    </span>
  )
}

export default function HospitalExpiry() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchBatches() {
    setLoading(true)
    setError(null)
    try {
      // GET /api/batches returns FEFO order (ascending expiryDate)
      const data = await apiFetch('/batches')
      setBatches(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  const relevant = batches.filter((b) => b.status === 'in_stock')
  const expiredCount = relevant.filter((b) => daysUntilExpiry(b.expiryDate) <= 0).length
  const warningCount = relevant.filter((b) => {
    const d = daysUntilExpiry(b.expiryDate)
    return d > 0 && d <= EXPIRY_WARNING_DAYS
  }).length
  const safeCount = relevant.length - expiredCount - warningCount

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Stock</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Expiry Tracker</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor items nearing expiration</p>
      </div>

      {!loading && !error && batches.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-200 bg-white p-5">
            <p className="flex items-center gap-1.5 text-sm text-rose-600">
              <AlertTriangle size={14} />
              Expired
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{expiredCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white p-5">
            <p className="flex items-center gap-1.5 text-sm text-amber-600">
              <CalendarClock size={14} />
              Expiring ≤ 30 days
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{warningCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-5">
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <ShieldCheck size={14} />
              Safe
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{safeCount}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading expiry data...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Could not load expiry data</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <CalendarClock size={28} className="mb-2 text-slate-300" />
          No batches to monitor
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">Drug</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Batch</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Expiry Date</th>
                  <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Qty</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const daysLeft = daysUntilExpiry(b.expiryDate)
                  const isUrgent = daysLeft <= EXPIRY_WARNING_DAYS
                  return (
                    <tr
                      key={b._id}
                      className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 ${
                        isUrgent ? (daysLeft <= 0 ? 'bg-rose-50/40' : 'bg-amber-50/40') : ''
                      }`}
                    >
                      <td className="px-6 py-3 text-slate-700">{b.drug?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {b.batchNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">{getExpiryBadge(daysLeft)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {b.quantity}
                      </td>
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
