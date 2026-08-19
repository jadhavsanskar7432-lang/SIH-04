import { useEffect, useMemo, useState } from 'react'
import { Search, Package, AlertTriangle } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK } from '../../theme/adminColors'

const STATUS_STYLES = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  in_transit: 'bg-amber-50 text-amber-700',
  consumed: 'bg-slate-100 text-slate-500',
  expired: 'bg-rose-50 text-rose-700',
  recalled: 'bg-rose-50 text-rose-700',
}

const STATUS_OPTIONS = ['all', 'in_stock', 'in_transit', 'consumed', 'expired', 'recalled']

function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
}

function urgencyAccent(batch) {
  if (batch.status === 'expired' || batch.status === 'recalled') return '#F43F5E'
  if (batch.status !== 'in_stock') return '#CBD5E1'
  const d = daysUntil(batch.expiryDate)
  if (d < 0) return '#F43F5E'
  if (d <= 30) return '#F59E0B'
  return '#D7FF5F'
}

export default function HospitalInventory() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchBatches()
  }, [])

  async function fetchBatches() {
    setLoading(true)
    setError(null)
    try {
      // GET /api/batches auto-scopes to this hospital via currentLocation
      const data = await apiFetch('/batches')
      setBatches(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inStock = batches.filter((b) => b.status === 'in_stock' && b.quantity > 0)
  const totalUnits = inStock.reduce((sum, b) => sum + b.quantity, 0)
  const distinctDrugs = new Set(inStock.map((b) => b.drug?._id)).size
  const expiringSoon = inStock.filter((b) => {
    const d = daysUntil(b.expiryDate)
    return d >= 0 && d <= 30
  }).length

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesBatch = b.batchNumber?.toLowerCase().includes(term)
        const matchesDrug = b.drug?.name?.toLowerCase().includes(term)
        const matchesVendor = b.vendor?.name?.toLowerCase().includes(term)
        if (!matchesBatch && !matchesDrug && !matchesVendor) return false
      }
      return true
    })
  }, [batches, searchTerm, statusFilter])

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Stock</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your hospital's stock, sorted by expiry (FEFO)
        </p>
      </div>

      {/* QUICK STATS */}
      {!loading && !error && batches.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div style={{ backgroundColor: DARK }} className="rounded-2xl p-5 text-white">
            <p className="text-sm text-white/50">Total Units in Stock</p>
            <p className="mt-1 text-2xl font-bold">{totalUnits.toLocaleString()}</p>
            <p className="mt-1 text-xs text-white/40">
              {distinctDrugs} drug{distinctDrugs !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Batches</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{batches.length}</p>
            <p className="mt-1 text-xs text-slate-400">All statuses</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white p-5">
            <p className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertTriangle size={14} />
              Expiring Soon
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{expiringSoon}</p>
            <p className="mt-1 text-xs text-slate-400">Within 30 days</p>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm sm:w-80">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search drug or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium capitalize text-slate-700 shadow-sm outline-none focus:border-[#12281F] sm:w-48"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'all' ? 'All statuses' : opt.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Could not load inventory</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchBatches}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <Package size={28} className="mb-2 text-slate-300" />
          {batches.length === 0 ? 'No stock at your hospital yet.' : 'No batches match your filters.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Showing {filtered.length} of {batches.length} batch{batches.length !== 1 ? 'es' : ''}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => {
              const d = daysUntil(b.expiryDate)
              const isUrgent = b.status === 'in_stock' && d >= 0 && d <= 30
              const isExpired = b.status === 'in_stock' && d < 0

              return (
                <div
                  key={b._id}
                  className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-popover"
                >
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: urgencyAccent(b) }} />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{b.drug?.name || '—'}</p>
                        <p className="font-mono text-[11px] text-slate-400">{b.batchNumber}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {b.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[11px] text-slate-400">Vendor</p>
                        <p className="text-xs font-medium text-slate-600">{b.vendor?.name || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">Quantity</p>
                        <p className="text-lg font-bold text-slate-900">{b.quantity?.toLocaleString() ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}</span>
                      {isExpired && (
                        <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[10px] font-bold text-danger-600">
                          EXPIRED
                        </span>
                      )}
                      {isUrgent && (
                        <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold text-warning-700">
                          {d}d left
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
