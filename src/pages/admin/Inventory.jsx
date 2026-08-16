import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { useApp } from '../../context/AppContext'

function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AdminInventory() {
  const { batches, drugs, hospitals } = useApp()
  const [query, setQuery] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('all')

  const rows = useMemo(() => {
    return batches
      .map((b) => {
        const drug = drugs.find((d) => d.id === b.drugId)
        const hospital = hospitals.find((h) => h.id === b.hospitalId)
        const remaining = daysUntil(b.expiry)
        return { ...b, drugName: drug?.name ?? '', hospitalName: hospital?.name ?? '', remaining, unit: drug?.unit }
      })
      .filter((r) => hospitalFilter === 'all' || r.hospitalId === hospitalFilter)
      .filter((r) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return (
          r.drugName.toLowerCase().includes(q) ||
          r.batchNo.toLowerCase().includes(q) ||
          r.hospitalName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.remaining - b.remaining)
  }, [batches, drugs, hospitals, query, hospitalFilter])

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Every batch, sorted oldest-expiry-first"
        description="Same order the FEFO engine uses when suggesting what a ward should dispense next."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drug, batch, or hospital…"
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-amber"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="hospital-filter" className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Hospital
          </label>
          <select
            id="hospital-filter"
            value={hospitalFilter}
            onChange={(e) => setHospitalFilter(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-amber"
          >
            <option value="all">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-medium">Batch</th>
              <th className="px-3 py-3 font-medium">Drug</th>
              <th className="px-3 py-3 font-medium">Hospital</th>
              <th className="px-3 py-3 font-medium">Expiry</th>
              <th className="px-3 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const nearExpiry = r.remaining <= 30
              return (
                <tr key={r.id} className={`border-b border-line last:border-0 ${nearExpiry ? 'bg-gold-soft/40' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-ink">{r.batchNo}</td>
                  <td className="px-3 py-3 text-sm text-ink-soft">{r.drugName}</td>
                  <td className="px-3 py-3 text-sm text-ink-soft">{r.hospitalName}</td>
                  <td className="px-3 py-3 text-sm text-ink-soft">{r.expiry}</td>
                  <td className="px-3 py-3 text-right text-sm text-ink-soft">{r.qty} {r.unit}</td>
                  <td className="px-4 py-3 text-right">
                    {nearExpiry ? (
                      <span className="text-xs font-medium text-gold">dispense first · {r.remaining}d left</span>
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-faint">
                  No batches match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}