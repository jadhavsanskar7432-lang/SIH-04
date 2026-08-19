import { useEffect, useState } from 'react'
import { ArrowRight, ArrowLeftRight, PackageCheck, Mail, Check, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT } from '../../theme/adminColors'

export default function AdminRedistribution() {
  const [suggestions, setSuggestions] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Per-suggestion approve state, keyed by fromHospital-toHospital-drug
  const [approveState, setApproveState] = useState({}) // { [key]: { submitting, result, error } }

  useEffect(() => {
    fetchSuggestions()
    fetchReminders()
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

  async function fetchReminders() {
    try {
      const data = await apiFetch('/insights/reminders')
      setReminders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load reminders:', err)
    }
  }

  // A suggestion has "been reminded about" if a Reminder exists matching
  // the same fromHospital/toHospital/drug triple.
  function matchingReminder(item) {
    const fromId = item.fromHospital?._id || item.fromHospital
    const toId = item.toHospital?._id || item.toHospital
    const drugId = item.drug?._id || item.drug
    return reminders.find(
      (r) =>
        (r.fromHospital?._id || r.fromHospital) === fromId &&
        (r.toHospital?._id || r.toHospital) === toId &&
        (r.drug?._id || r.drug) === drugId
    )
  }

  function suggestionKey(item) {
    return `${item.fromHospital?._id || item.fromHospital}-${
      item.toHospital?._id || item.toHospital
    }-${item.drug?._id || item.drug}`
  }

  async function handleApprove(item) {
    const key = suggestionKey(item)
    setApproveState((prev) => ({ ...prev, [key]: { submitting: true } }))
    try {
      const result = await apiFetch('/insights/redistribution/approve', {
        method: 'POST',
        body: JSON.stringify({
          fromHospital: item.fromHospital?._id || item.fromHospital,
          toHospital: item.toHospital?._id || item.toHospital,
          drug: item.drug?._id || item.drug,
          quantity: item.suggestedQuantity,
        }),
      })
      setApproveState((prev) => ({ ...prev, [key]: { submitting: false, result } }))
      // Stock has actually moved — refresh so this suggestion drops out
      // once it's no longer a genuine shortage/surplus pair.
      fetchSuggestions()
    } catch (err) {
      setApproveState((prev) => ({
        ...prev,
        [key]: { submitting: false, error: err.message },
      }))
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
          {suggestions.map((item, index) => {
            const reminder = matchingReminder(item)
            return (
              <div
                key={`${item.fromHospital?._id || item.fromHospital}-${
                  item.toHospital?._id || item.toHospital
                }-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight size={14} className="text-slate-400" />
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: '#F5F7ED', color: '#4F5D22' }}
                    >
                      Suggested transfer
                    </span>
                  </div>

                  {reminder && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <Mail size={11} />
                      Hospital reminded you
                    </span>
                  )}
                </div>

                {item.drug?.name && (
                  <p className="mt-3 font-semibold text-slate-900">{item.drug.name}</p>
                )}

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

                {(() => {
                  const key = suggestionKey(item)
                  const state = approveState[key]

                  if (state?.result) {
                    return (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                        <Check size={14} />
                        {state.result.partial
                          ? `Transferred ${state.result.transferred} of ${state.result.requested} units — donor ran lower than expected.`
                          : `Transferred ${state.result.transferred} units. Both hospitals' stock has been updated.`}
                      </div>
                    )
                  }

                  return (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={state?.submitting}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: DARK, color: 'white' }}
                      >
                        <Check size={13} />
                        {state?.submitting ? 'Transferring…' : 'Approve & Transfer Stock'}
                      </button>
                      {state?.error && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-danger-600">
                          <AlertCircle size={12} />
                          {state.error}
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
