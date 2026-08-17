import { useEffect, useState } from 'react'
import { apiFetch } from '../../api'
import PageHeader from '../../components/ui/PageHeader'
import RegisterTable from '../../components/supply/RegisterTable'

export default function HospitalInventory() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        // GET /api/batches auto-scopes to this hospital via currentLocation
        const data = await apiFetch('/batches')
        setBatches(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBatches()
  }, [])

  // Map batch documents to the row shape RegisterTable expects
  const rows = batches.map((b) => ({
    batch: b.batchNumber,
    drug: b.drug?.name || '—',
    expiry: b.expiryDate
      ? new Date(b.expiryDate).toLocaleDateString()
      : '—',
    qty: b.quantity,
    flag:
      b.status === 'expired'
        ? 'Expired'
        : b.status === 'recalled'
          ? 'Recalled'
          : null,
  }))

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="View and manage your hospital's stock"
      />

      {loading && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
          <p className="text-sm text-slate-400">Loading inventory…</p>
        </div>
      )}

      {error && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50">
          <p className="text-sm text-red-500">Error: {error}</p>
        </div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
          <p className="text-sm text-slate-400">No stock at your hospital</p>
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Showing {batches.length} batch{batches.length !== 1 ? 'es' : ''} (earliest expiry first)
          </p>

          <div className="w-full max-w-full overflow-x-auto">
            <RegisterTable title="Your Stock" rows={rows} />
          </div>
        </div>
      )}
    </div>
  )
}