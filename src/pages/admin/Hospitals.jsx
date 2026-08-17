import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { apiFetch } from '../../api'

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'inactive'
  
  // Action state
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
    const isCurrentlyActive = hospital.isActive;
    
    // Simple confirmation before deactivation
    if (isCurrentlyActive) {
      const confirm = window.confirm(`Are you sure you want to deactivate ${hospital.name}?`);
      if (!confirm) return;
    }

    setActionLoading(hospital._id)
    try {
      const updated = await apiFetch(`/hospitals/${hospital._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isCurrentlyActive })
      })
      
      // Update local state immediately
      setHospitals((prev) => 
        prev.map(h => h._id === updated._id ? updated : h)
      )
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter hospitals client-side
  const filteredHospitals = hospitals.filter(h => {
    // 1. Status filter
    if (statusFilter === 'active' && !h.isActive) return false;
    if (statusFilter === 'inactive' && h.isActive) return false;
    
    // 2. Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchesName = h.name.toLowerCase().includes(term)
      const matchesEmail = h.email.toLowerCase().includes(term)
      const matchesLocation = h.location.toLowerCase().includes(term)
      
      if (!matchesName && !matchesEmail && !matchesLocation) return false;
    }
    
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Hospitals"
        description="View and manage connected hospital accounts"
      />
      
      {/* Controls: Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input 
          type="text"
          placeholder="Search by name, email, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        />
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="statusFilter" className="text-sm font-medium text-slate-600 whitespace-nowrap">Status:</label>
          <select 
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading hospitals...</p>}
      
      {error && (
        <div className="mb-4 text-sm text-rose-600">
          <p>Failed to load hospitals: {error}</p>
          <button onClick={fetchHospitals} className="mt-2 text-indigo-600 underline">Retry</button>
        </div>
      )}
      
      {!loading && !error && filteredHospitals.length === 0 && (
        <p className="text-sm text-slate-500">No hospitals found.</p>
      )}
      
      {!loading && !error && filteredHospitals.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">Name & Email</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Location</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Contact</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredHospitals.map((h) => (
                  <tr key={h._id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{h.name}</div>
                      <div className="text-slate-500 text-xs">{h.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{h.location}</td>
                    <td className="px-6 py-4 text-slate-500">{h.contact || '-'}</td>
                    <td className="px-6 py-4">
                      {h.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(h)}
                        disabled={actionLoading === h._id}
                        className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          h.isActive 
                            ? 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } disabled:opacity-50`}
                      >
                        {actionLoading === h._id ? 'Updating...' : h.isActive ? 'Deactivate' : 'Activate'}
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