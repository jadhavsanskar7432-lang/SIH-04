import { useEffect, useMemo, useState } from 'react'
import { Search, Package } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK } from '../../theme/adminColors'

const STATUS_STYLES = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  in_transit: 'bg-amber-50 text-amber-700',
  consumed: 'bg-slate-100 text-slate-500',
  expired: 'bg-rose-50 text-rose-700',
  recalled: 'bg-rose-50 text-rose-700',
}

const STATUS_OPTIONS = [
  'all',
  'in_stock',
  'in_transit',
  'consumed',
  'expired',
  'recalled',
]

export default function AdminInventory() {
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
      const data = await apiFetch('/batches')
      setBatches(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Stock
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">
          All batches across the network, sorted by expiry (FEFO)
        </p>
      </div>

      {/* CONTROLS */}
      <div className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm sm:w-80">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch, drug, or vendor..."
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
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading batches...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Could not load inventory
          </h2>
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
          {batches.length === 0
            ? 'No batches found.'
            : 'No batches match your filters.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Showing {filtered.length} of {batches.length} batch
            {batches.length !== 1 ? 'es' : ''}
          </p>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-slate-500">Batch</th>
                    <th className="px-6 py-3 font-medium text-slate-500">Drug</th>
                    <th className="px-6 py-3 font-medium text-slate-500">Vendor</th>
                    <th className="px-6 py-3 text-right font-medium text-slate-500">
                      Quantity
                    </th>
                    <th className="px-6 py-3 font-medium text-slate-500">Expiry</th>
                    <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((b) => (
                    <tr key={b._id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">
                        {b.batchNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        {b.drug?.name || '—'}
                        {b.drug?.unit && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({b.drug.unit})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {b.vendor?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">
                        {b.quantity?.toLocaleString() ?? 0}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {b.expiryDate
                          ? new Date(b.expiryDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {b.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
