import { useEffect, useState } from 'react'
import { CalendarClock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { apiFetch } from '../../api'

const EXPIRY_WARNING_DAYS = 30

function daysUntilExpiry(expiryDate) {
  const now = new Date()
  const exp = new Date(expiryDate)
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
}

function urgencyAccent(daysLeft) {
  if (daysLeft <= 0) return '#F43F5E'
  if (daysLeft <= EXPIRY_WARNING_DAYS) return '#F59E0B'
  return '#D7FF5F'
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
        <div className="space-y-3">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => {
            const daysLeft = daysUntilExpiry(b.expiryDate)
            return (
              <div
                key={b._id}
                className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-popover"
              >
                <div className="w-1.5 shrink-0" style={{ backgroundColor: urgencyAccent(daysLeft) }} />

                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{b.drug?.name || '—'}</p>
                      <p className="font-mono text-[11px] text-slate-400">{b.batchNumber}</p>
                    </div>
                    {getExpiryBadge(daysLeft)}
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[11px] text-slate-400">Expiry Date</p>
                      <p className="text-xs font-medium text-slate-600">
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Quantity</p>
                      <p className="text-lg font-bold text-slate-900">{b.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
