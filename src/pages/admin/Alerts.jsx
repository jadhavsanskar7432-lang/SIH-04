import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, ShieldCheck } from 'lucide-react'
import { apiFetch } from '../../api'
import { DARK } from '../../theme/adminColors'

const SEVERITY_STYLES = {
  red: {
    border: 'border-rose-200',
    badge: 'bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    label: 'Critical',
  },
  yellow: {
    border: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
  green: {
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Normal',
  },
}

const SEVERITY_ORDER = { red: 0, yellow: 1, green: 2 }

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAlerts()
  }, [])

  async function fetchAlerts() {
    try {
      setLoading(true)
      setError('')
      const data = await apiFetch('/insights/alerts')
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not load alerts')
    } finally {
      setLoading(false)
    }
  }

  const critical = alerts.filter((a) => a.severity === 'red').length
  const warning = alerts.filter((a) => a.severity === 'yellow').length

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Monitoring
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Stock-out risk across every hospital + drug pair, last 30 days
          </p>
        </div>

        {!loading && !error && alerts.length > 0 && (
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
              <AlertTriangle size={12} />
              {critical} critical
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Bell size={12} />
              {warning} warning
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200"
              style={{ borderTopColor: DARK }}
            />
            <p className="mt-3 text-sm text-slate-500">Loading alerts...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Could not load alerts</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchAlerts}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          <ShieldCheck size={28} className="mb-2 text-slate-300" />
          No stock alerts right now — everything looks healthy.
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...alerts]
            .sort(
              (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
            )
            .map((alert, index) => {
              const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.green
              return (
                <div
                  key={`${alert.drug?._id || alert.drug}-${
                    alert.hospital?._id || alert.hospital
                  }-${index}`}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${s.border}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.badge}`}
                    >
                      {s.label}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    {alert.drug?.name || alert.drug}
                  </p>
                  <p className="text-xs text-slate-500">
                    {alert.hospital?.name || alert.hospital}
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    {alert.reasons?.join(' ') ||
                      `Current stock: ${alert.currentStock}`}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>
                      {alert.daysOfStockLeft != null
                        ? `${alert.daysOfStockLeft}d of stock left`
                        : 'No burn-rate data'}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {alert.currentStock ?? 0} units on hand
                    </span>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
