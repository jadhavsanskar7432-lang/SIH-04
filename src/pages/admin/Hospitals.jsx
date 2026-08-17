import { useEffect, useState } from 'react'
import { Search, Building2 } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK, LIME, LIME_TEXT } from '../../theme/adminColors'

function PageHeader() {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Network
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Hospitals</h1>
      <p className="mt-1 text-sm text-slate-500">
        View and manage connected hospital accounts
      </p>
    </div>
  )
}

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'inactive'

  const [actionLoading, setActionLoading] = useState(null) // holds hospital id being processed

  useEffect(() => {
    fetchHospitals()
  }, [])

  async function fetchHospitals() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/hospitals')
      setHospitals(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (hospital) => {
    const isCurrentlyActive = hospital.isActive

    if (isCurrentlyActive) {
      const confirm = window.confirm(
        `Are you sure you want to deactivate ${hospital.name}?`
      )
      if (!confirm) return
    }

    setActionLoading(hospital._id)
    try {
      const updated = await apiFetch(`/hospitals/${hospital._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isCurrentlyActive }),
      })

      setHospitals((prev) =>
        prev.map((h) => (h._id === updated._id ? updated : h))
      )
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredHospitals = hospitals.filter((h) => {
    if (statusFilter === 'active' && !h.isActive) return false
    if (statusFilter === 'inactive' && h.isActive) return false

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchesName = h.name.toLowerCase().includes(term)
      const matchesEmail = h.email.toLowerCase().includes(term)
      const matchesLocation = h.location.toLowerCase().includes(term)

      if (!matchesName && !matchesEmail && !matchesLocation) return false
    }

    return true
  })

  return (
    <div>
      <PageHeader />

      {/* CONTROLS */}
      <div className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm sm:w-80">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {['all', 'active', 'inactive'].map((opt) => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                statusFilter === opt
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              style={statusFilter === opt ? { backgroundColor: DARK } : undefined}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading hospitals...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Could not load hospitals
          </h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchHospitals}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredHospitals.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <Building2 size={28} className="mb-2 text-slate-300" />
          No hospitals found.
        </div>
      )}

      {!loading && !error && filteredHospitals.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">
                    Name & Email
                  </th>
                  <th className="px-6 py-3 font-medium text-slate-500">
                    Location
                  </th>
                  <th className="px-6 py-3 font-medium text-slate-500">
                    Contact
                  </th>
                  <th className="px-6 py-3 font-medium text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredHospitals.map((h) => (
                  <tr key={h._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{h.name}</div>
                      <div className="text-xs text-slate-500">{h.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{h.location}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {h.contact || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {h.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(h)}
                        disabled={actionLoading === h._id}
                        className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          h.isActive
                            ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                            : ''
                        }`}
                        style={
                          !h.isActive
                            ? { backgroundColor: LIME, color: LIME_TEXT }
                            : undefined
                        }
                      >
                        {actionLoading === h._id
                          ? 'Updating...'
                          : h.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
