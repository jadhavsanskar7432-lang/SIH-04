import { useEffect, useState } from 'react'
import { Mail, Clock3 } from 'lucide-react'
import { apiFetch } from '../../api'
import PageHeader from '../../components/ui/PageHeader'
import AlertCard from '../../components/supply/AlertCard'
import AlertFeed from '../../components/supply/AlertFeed'

const severityToLevel = {
  red: 'critical',
  yellow: 'warning',
  green: 'normal',
}

function RedistributionStatusCard({ item }) {
  const [reminded, setReminded] = useState(false)

  const handleRemind = () => {
    /*
      Email integration will be connected here when the
      notification endpoint is implemented by the backend.

      We intentionally do not pretend an email was sent yet.
    */
    setReminded(true)
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-line bg-white/70 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
          Redistribution recommendation
        </span>

        <Clock3 className="h-3.5 w-3.5 text-amber" aria-hidden="true" />
      </div>

      <p className="mt-2.5 font-display text-[17px] font-medium text-ink">
        {item.drug?.name || item.drug}
      </p>

      <div className="mt-3 rounded bg-paper-dim px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[12px] text-ink-soft">
              {item.fromHospital?.name || item.fromHospital}
            </p>
            <p className="font-mono text-[10px] text-ink-faint">
              has spare stock
            </p>
          </div>

          <span className="text-amber">→</span>

          <div className="min-w-0">
            <p className="truncate text-[12px] text-ink-soft">
              {item.toHospital?.name || item.toHospital}
            </p>
            <p className="font-mono text-[10px] text-ink-faint">
              needs {item.suggestedQuantity}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
        {item.reason ||
          'A redistribution recommendation has been generated for this hospital.'}
      </p>

      <div className="mt-3 rounded border border-gold/30 bg-gold-soft px-3 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-wide text-gold">
          Pending procurement review
        </p>

        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
          This recommendation requires review before procurement or shipment
          can proceed.
        </p>
      </div>

      <div className="mt-3 border-t border-line pt-3">
        {reminded ? (
          <div className="flex items-center gap-2 text-[11px] text-moss">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Reminder request recorded
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRemind}
            className="flex w-full items-center justify-center gap-2 rounded border border-amber/40 bg-amber/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-amber transition-colors hover:bg-amber/20"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Remind Admin
          </button>
        )}
      </div>
    </div>
  )
}

export default function HospitalAlerts() {
  const [alerts, setAlerts] = useState([])
  const [redistributions, setRedistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true)
        setError('')

        const [alertsData, redistributionData] = await Promise.all([
          apiFetch('/insights/alerts'),
          apiFetch('/insights/redistribution'),
        ])

        setAlerts(Array.isArray(alertsData) ? alertsData : [])
        setRedistributions(
          Array.isArray(redistributionData) ? redistributionData : []
        )
      } catch (err) {
        setError(err.message || 'Could not load alerts')
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [])

  const feedItems = alerts.map((alert) => ({
    level: severityToLevel[alert.severity] || 'normal',
    text: `${alert.drug?.name || alert.drug} — ${alert.hospital?.name || alert.hospital
      }: ${alert.reasons?.[0] || 'Stock alert'}`,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Stock warnings and supply alerts for your hospital"
      />

      {loading && (
        <div className="rounded-md border border-line bg-white/70 p-4 text-sm text-ink-soft">
          Loading alerts...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-coral/30 bg-coral-soft p-4 text-sm text-coral">
          {error}
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="rounded-md border border-line bg-white/70 p-4 text-sm text-ink-soft">
          No stock alerts right now.
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <>
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest2 text-ink-faint">
              Current alerts
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert, index) => (
                <AlertCard
                  key={`${alert.drug?._id || alert.drug}-${alert.hospital?._id || alert.hospital
                    }-${index}`}
                  level={severityToLevel[alert.severity] || 'normal'}
                  drug={alert.drug?.name || alert.drug}
                  hospital={alert.hospital?.name || alert.hospital}
                  detail={
                    alert.reasons?.join(' ') ||
                    `Current stock: ${alert.currentStock}`
                  }
                  eta={
                    alert.daysOfStockLeft != null
                      ? `${alert.daysOfStockLeft} days of stock remaining`
                      : undefined
                  }
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest2 text-ink-faint">
              Alert feed
            </h2>

            <AlertFeed items={feedItems} />
          </section>
        </>
      )}

      {!loading && !error && redistributions.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest2 text-ink-faint">
            Redistribution recommendations
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {redistributions.map((item, index) => (
              <RedistributionStatusCard
                key={`${item.drug?._id || item.drug}-${item.fromHospital?._id || item.fromHospital
                  }-${item.toHospital?._id || item.toHospital}-${index}`}
                item={item}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}