import { useEffect, useState } from 'react'
import { apiFetch } from '../../api'
import PageHeader from '../../components/ui/PageHeader'

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

  // Load drug list for the dropdown + recent consumption logs
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

  // Submit consumption log
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
      const body = {
        drug: selectedDrug,
        quantityUsed: Number(quantityUsed),
      }
      // Only send date if user filled it in (otherwise backend defaults to today)
      if (date) body.date = date

      const newLog = await apiFetch('/consumption', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      // Refresh the history list
      const updated = await apiFetch('/consumption?days=30')
      setLogs(updated)

      // Reset form
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

  return (
    <div>
      <PageHeader title="Consumption" description="Track supply usage trends over time" />

      {/* ── Log Consumption Form ────────────────────────────────── */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Log Consumption</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Drug select */}
          <div>
            <label htmlFor="drug-select" className="mb-1 block text-sm text-slate-600">Drug</label>
            <select
              id="drug-select"
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select drug…</option>
              {drugs.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="qty-input" className="mb-1 block text-sm text-slate-600">Quantity Used</label>
            <input
              id="qty-input"
              type="number"
              min="1"
              value={quantityUsed}
              onChange={(e) => setQuantityUsed(e.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Optional date */}
          <div>
            <label htmlFor="date-input" className="mb-1 block text-sm text-slate-600">Date (optional)</label>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Log Consumption'}
            </button>
          </div>
        </form>

        {/* Form message */}
        {formMsg && (
          <p className={`mt-3 text-sm ${formMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
            {formMsg.text}
          </p>
        )}
      </div>

      {/* ── Recent Consumption History ──────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent History (30 days)</h2>
        </div>

        {loadingLogs && (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-slate-400">Loading…</p>
          </div>
        )}

        {logsError && (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-red-500">Error: {logsError}</p>
          </div>
        )}

        {!loadingLogs && !logsError && logs.length === 0 && (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-slate-400">No consumption records in the last 30 days</p>
          </div>
        )}

        {!loadingLogs && !logsError && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="px-6 py-3 font-medium">Drug</th>
                  <th className="px-4 py-3 font-medium">Qty Used</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3 text-slate-700">{log.drug?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{log.quantityUsed}</td>
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
    </div>
  )
}