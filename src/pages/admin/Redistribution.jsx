import { useEffect, useState } from 'react'
import { ArrowRight, ArrowLeftRight, PackageCheck } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT } from '../../theme/adminColors'

export default function AdminRedistribution() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSuggestions()
  }, [])

  async function fetchSuggestions() {
    try {
      setLoading(true)
      setError('')
      const data = await apiFetch('/insights/redistribution')
      setSuggestions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not load redistribution suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Monitoring
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Redistribution
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Surplus stock at one hospital that could cover a shortage at another
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">
              Scanning hospitals for surplus stock...
            </p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Could not load redistribution suggestions
          </h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchSuggestions}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <PackageCheck size={28} className="mb-2 text-slate-300" />
          No redistribution opportunities right now.
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((item, index) => (
            <div
              key={`${item.fromHospital?._id || item.fromHospital}-${
                item.toHospital?._id || item.toHospital
              }-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={14} className="text-slate-400" />
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: '#F5F7ED', color: '#4F5D22' }}
                >
                  Suggested transfer
                </span>
              </div>

              <div className="mt-3 flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:justify-between">
                <div className="min-w-0 text-center sm:text-left">
                  <p className="truncate font-semibold text-slate-900">
                    {item.fromHospital?.name || 'Unknown hospital'}
                  </p>
                  <p className="text-xs text-slate-500">has surplus</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <ArrowRight size={18} className="text-slate-400" />
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: LIME, color: LIME_TEXT }}
                  >
                    {item.suggestedQuantity} units
                  </span>
                </div>

                <div className="min-w-0 text-center sm:text-right">
                  <p className="truncate font-semibold text-slate-900">
                    {item.toHospital?.name || 'Unknown hospital'}
                  </p>
                  <p className="text-xs text-slate-500">needs stock</p>
                </div>
              </div>

              {item.reason && (
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {item.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
