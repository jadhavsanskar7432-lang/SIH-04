import { useEffect, useState } from 'react'
import { apiFetch } from '../../api'
import PageHeader from '../../components/ui/PageHeader'
import RegisterTable from '../../components/supply/RegisterTable'

export default function AdminInventory() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBatches = async () => {
      try {
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
    // Flag expired or near-expiry batches visually
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
        description="Manage stock levels across all hospital locations"
      />

      {loading && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
          <p className="text-sm text-slate-400">Loading batches…</p>
        </div>
      )}

      {error && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50">
          <p className="text-sm text-red-500">Error: {error}</p>
        </div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
          <p className="text-sm text-slate-400">No batches found</p>
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <div className="space-y-4">
          {/* Summary line */}
          <p className="text-sm text-slate-500">
            Showing {batches.length} batch{batches.length !== 1 ? 'es' : ''} (FEFO order)
          </p>

          {/* Full-width wrapper so the table stretches */}
          <div className="w-full max-w-full overflow-x-auto">
            <RegisterTable title="All Batches" rows={rows} />
          </div>
        </div>
      )}
    </div>
  )
}