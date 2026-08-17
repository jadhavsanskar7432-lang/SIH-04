import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Award, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT } from '../../theme/adminColors'

const PILL_COLORS = ['#F97316', '#12281F', '#0EA5A4', '#F43F5E', '#6366F1']

export default function HospitalConsumption() {
  // --- Form state ---
  const [drugs, setDrugs] = useState([])
  const [selectedDrug, setSelectedDrug] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState(null) // { type: 'success'|'error', text }

  // --- History state ---
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [logsError, setLogsError] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [selectedDrugId, setSelectedDrugId] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const [drugList, logList] = await Promise.all([
          apiFetch('/drugs'),
          apiFetch('/consumption?days=30'),
        ])
        setDrugs(drugList)
        setLogs(logList)
      } catch (err) {
        setLogsError(err.message)
      } finally {
        setLoadingLogs(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (loadingLogs) return
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [loadingLogs])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormMsg(null)

    if (!selectedDrug) {
      setFormMsg({ type: 'error', text: 'Please select a drug' })
      return
    }
    if (!quantityUsed || Number(quantityUsed) <= 0) {
      setFormMsg({ type: 'error', text: 'Quantity must be a positive number' })
      return
    }

    setSubmitting(true)
    try {
      const body = { drug: selectedDrug, quantityUsed: Number(quantityUsed) }
      if (date) body.date = date

      await apiFetch('/consumption', { method: 'POST', body: JSON.stringify(body) })

      const updated = await apiFetch('/consumption?days=30')
      setLogs(updated)

      setSelectedDrug('')
      setQuantityUsed('')
      setDate('')
      setFormMsg({ type: 'success', text: 'Consumption logged successfully' })
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Top consumed drugs, derived from the already-fetched 30-day log set
  const topDrugs = useMemo(() => {
    const map = {}
    logs.forEach((log) => {
      if (!log.drug) return
      const id = log.drug._id
      if (!map[id]) map[id] = { drug: log.drug, quantityConsumed: 0 }
      map[id].quantityConsumed += log.quantityUsed || 0
    })
    return Object.values(map)
      .sort((a, b) => b.quantityConsumed - a.quantityConsumed)
      .slice(0, 5)
  }, [logs])
  const maxTopDrug = Math.max(...topDrugs.map((d) => d.quantityConsumed), 1)
  const totalConsumed30d = logs.reduce((sum, l) => sum + (l.quantityUsed || 0), 0)

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Usage</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Consumption</h1>
        <p className="mt-1 text-sm text-slate-500">
          Log daily usage and track supply trends over time
        </p>
      </div>

      {/* QUICK STATS */}
      {!loadingLogs && !logsError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div style={{ backgroundColor: DARK }} className="rounded-2xl p-5 text-white">
            <p className="text-sm text-white/50">Total Consumed (30 days)</p>
            <p className="mt-1 text-2xl font-bold">{totalConsumed30d.toLocaleString()} units</p>
            <p className="mt-1 text-xs text-white/40">{logs.length} log entries</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Most Consumed Drug</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {topDrugs[0]?.drug?.name || '—'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {topDrugs[0] ? `${topDrugs[0].quantityConsumed.toLocaleString()} units used` : 'No data yet'}
            </p>
          </div>
        </div>
      )}

      {/* LOG CONSUMPTION FORM */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <ClipboardList size={18} style={{ color: DARK }} />
          <h2 className="text-base font-semibold text-slate-900">Log Consumption</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="drug-select" className="mb-1 block text-sm text-slate-600">
              Drug
            </label>
            <select
              id="drug-select"
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
            >
              <option value="">Select drug…</option>
              {drugs.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qty-input" className="mb-1 block text-sm text-slate-600">
              Quantity Used
            </label>
            <input
              id="qty-input"
              type="number"
              min="1"
              value={quantityUsed}
              onChange={(e) => setQuantityUsed(e.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
            />
          </div>

          <div>
            <label htmlFor="date-input" className="mb-1 block text-sm text-slate-600">
              Date (optional)
            </label>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: LIME, color: LIME_TEXT }}
            >
              {submitting ? 'Saving…' : 'Log Consumption'}
            </button>
          </div>
        </form>

        {formMsg && (
          <p
            className={`mt-3 flex items-center gap-1.5 text-sm ${
              formMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formMsg.type === 'success' ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            {formMsg.text}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* HISTORY TABLE */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent History</h2>
            <p className="text-sm text-slate-500">Last 30 days</p>
          </div>

          {loadingLogs && (
            <div className="flex h-40 items-center justify-center">
              <div
                className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200"
                style={{ borderTopColor: DARK }}
              />
            </div>
          )}

          {!loadingLogs && logsError && (
            <div className="p-6">
              <p className="text-sm text-rose-600">Error: {logsError}</p>
            </div>
          )}

          {!loadingLogs && !logsError && logs.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              No consumption records in the last 30 days
            </div>
          )}

          {!loadingLogs && !logsError && logs.length > 0 && (
            <div className="max-h-[460px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <th className="px-6 py-3 font-medium">Drug</th>
                    <th className="px-4 py-3 font-medium">Qty Used</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-6 py-3 text-slate-700">{log.drug?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {log.quantityUsed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {log.date ? new Date(log.date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TOP CONSUMED DRUGS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Top Consumed Drugs</h2>
          <p className="mb-5 text-sm text-slate-500">Last 30 days · tap for details</p>

          {topDrugs.length > 0 ? (
            <div className="space-y-2">
              {topDrugs.map((item, index) => {
                const id = item.drug?._id || index
                const isSelected = selectedDrugId === id
                const width = (item.quantityConsumed / maxTopDrug) * 100
                const color = PILL_COLORS[index % PILL_COLORS.length]

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedDrugId(isSelected ? null : id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                      isSelected ? 'shadow-sm' : 'border-transparent hover:bg-slate-50'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: `${color}14`, borderColor: `${color}55` }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {index === 0 ? <Award size={13} /> : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {item.drug?.name || 'Unknown Drug'}
                          </p>
                          <span className="shrink-0 text-sm font-semibold text-slate-800">
                            {item.quantityConsumed.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: mounted ? `${Math.max(width, 4)}%` : '0%',
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                        {item.drug?.genericName || 'No generic name on file'}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              No consumption data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
