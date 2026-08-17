import { useEffect, useState } from 'react'
import { Sparkles, Award, MapPin, Clock } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT } from '../../theme/adminColors'

export default function AdminProcurement() {
  const [drugs, setDrugs] = useState([])
  const [drugsLoading, setDrugsLoading] = useState(true)
  const [drugsError, setDrugsError] = useState(null)

  const [selectedDrugId, setSelectedDrugId] = useState('')
  const [recommendations, setRecommendations] = useState(null) // null = not yet fetched
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState(null)

  useEffect(() => {
    async function fetchDrugs() {
      setDrugsLoading(true)
      setDrugsError(null)
      try {
        const data = await apiFetch('/drugs')
        setDrugs(data)
      } catch (err) {
        setDrugsError(err.message)
      } finally {
        setDrugsLoading(false)
      }
    }
    fetchDrugs()
  }, [])

  useEffect(() => {
    if (!selectedDrugId) {
      setRecommendations(null)
      return
    }

    async function fetchRecommendations() {
      setRecLoading(true)
      setRecError(null)
      try {
        const data = await apiFetch(`/procurement/recommend/${selectedDrugId}`)
        setRecommendations(Array.isArray(data) ? data : [])
      } catch (err) {
        setRecError(err.message)
      } finally {
        setRecLoading(false)
      }
    }
    fetchRecommendations()
  }, [selectedDrugId])

  const selectedDrug = drugs.find((d) => d._id === selectedDrugId)

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Procurement
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Procurement Recommendation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick a drug to rank vendors by reliability and delivery recency
        </p>
      </div>

      {/* DRUG SELECTOR */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Drug
        </label>

        {drugsLoading && (
          <p className="text-sm text-slate-400">Loading drug catalog...</p>
        )}

        {!drugsLoading && drugsError && (
          <p className="text-sm text-rose-600">
            Could not load drugs: {drugsError}
          </p>
        )}

        {!drugsLoading && !drugsError && drugs.length === 0 && (
          <p className="text-sm text-slate-400">No drugs in the catalog yet.</p>
        )}

        {!drugsLoading && !drugsError && drugs.length > 0 && (
          <select
            value={selectedDrugId}
            onChange={(e) => setSelectedDrugId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#12281F] sm:w-80"
          >
            <option value="">Select a drug…</option>
            {drugs.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
                {d.genericName ? ` (${d.genericName})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* RECOMMENDATIONS */}
      {!selectedDrugId && (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <Sparkles size={28} className="mb-2 text-slate-300" />
          Select a drug above to see recommended vendors.
        </div>
      )}

      {selectedDrugId && recLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">
              Scoring vendors for {selectedDrug?.name}...
            </p>
          </div>
        </div>
      )}

      {selectedDrugId && !recLoading && recError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Could not load recommendations
          </h2>
          <p className="mt-1 text-sm text-red-600">{recError}</p>
        </div>
      )}

      {selectedDrugId &&
        !recLoading &&
        !recError &&
        recommendations &&
        recommendations.length === 0 && (
          <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
            <Sparkles size={28} className="mb-2 text-slate-300" />
            No vendor has ever supplied {selectedDrug?.name || 'this drug'} —
            nothing to rank yet.
          </div>
        )}

      {selectedDrugId &&
        !recLoading &&
        !recError &&
        recommendations &&
        recommendations.length > 0 && (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={rec.vendor?._id || index}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={
                      index === 0
                        ? { backgroundColor: LIME, color: LIME_TEXT }
                        : { backgroundColor: '#F1F5F9', color: '#475569' }
                    }
                  >
                    {index === 0 ? <Award size={18} /> : index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {rec.vendor?.name || 'Unknown vendor'}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={12} />
                      {rec.vendor?.location || 'Unknown location'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Match score</p>
                    <p className="text-lg font-bold text-slate-900">
                      {rec.score}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Reliability</p>
                    <p className="text-lg font-bold text-slate-900">
                      {rec.reliabilityScore}%
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} />
                    {rec.lastSuppliedDate
                      ? `Last supplied ${new Date(
                          rec.lastSuppliedDate
                        ).toLocaleDateString()}`
                      : 'Never delivered this drug'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
