import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { apiFetch } from '../../api'

export default function AdminVendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchVendors() {
      try {
        const data = await apiFetch('/vendors')
        setVendors(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchVendors()
  }, [])

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="View and manage registered vendors"
      />
      {loading && <p className="text-sm text-slate-500">Loading vendors...</p>}
      {error && <p className="text-sm text-rose-600">Failed to load vendors: {error}</p>}
      {!loading && !error && vendors.length === 0 && (
        <p className="text-sm text-slate-500">No vendors found.</p>
      )}
      {!loading && !error && vendors.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-slate-500">Name</th>
                <th className="px-6 py-3 text-left font-medium text-slate-500">Location</th>
                <th className="px-6 py-3 text-left font-medium text-slate-500">Contact</th>
                <th className="px-6 py-3 text-right font-medium text-slate-500">Reliability Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vendors.map((v) => (
                <tr key={v._id}>
                  <td className="px-6 py-4 text-slate-900 font-medium">{v.name}</td>
                  <td className="px-6 py-4 text-slate-500">{v.location}</td>
                  <td className="px-6 py-4 text-slate-500">{v.contact || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                      {v.reliabilityScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}