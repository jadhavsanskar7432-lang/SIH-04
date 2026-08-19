import { useEffect, useMemo, useState } from 'react'
import { Users, MapPin, Phone, Search } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT } from '../../theme/adminColors'

function reliabilityColor(score) {
  if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50' }
  return { text: 'text-rose-600', bg: 'bg-rose-50' }
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('reliability') // 'reliability' | 'name'

  useEffect(() => {
    fetchVendors()
  }, [])

  async function fetchVendors() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/vendors')
      setVendors(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const visibleVendors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = term
      ? vendors.filter(
          (v) =>
            v.name?.toLowerCase().includes(term) ||
            v.location?.toLowerCase().includes(term)
        )
      : vendors

    // Backend already returns vendors sorted by reliability desc — only
    // re-sort client-side when the user picks the other option.
    if (sortBy === 'name') {
      return [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    return filtered
  }, [vendors, searchTerm, sortBy])

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Network
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage registered vendors, ranked by reliability
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-card sm:w-64">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendors..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-card outline-none transition-colors focus:border-brand-900"
          >
            <option value="reliability">Sort: Reliability</option>
            <option value="name">Sort: Name (A–Z)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading vendors...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Could not load vendors</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchVendors}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && visibleVendors.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <Users size={28} className="mb-2 text-slate-300" />
          {vendors.length === 0 ? 'No vendors found.' : 'No vendors match your search.'}
        </div>
      )}

      {!loading && !error && visibleVendors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleVendors.map((v, index) => {
            const colors = reliabilityColor(v.reliabilityScore ?? 0)
            return (
              <div
                key={v._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={
                        sortBy === 'reliability' && index === 0
                          ? { backgroundColor: LIME, color: LIME_TEXT }
                          : { backgroundColor: '#F1F5F9', color: '#475569' }
                      }
                    >
                      {v.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{v.name}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={12} />
                        {v.location || 'Unknown location'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}
                  >
                    {v.reliabilityScore ?? 0}%
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone size={12} />
                    {v.contact || 'No contact on file'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
