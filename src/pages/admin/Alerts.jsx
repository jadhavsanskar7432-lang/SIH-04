import { useEffect, useState } from 'react'
import { apiFetch } from '../../api'
import PageHeader from '../../components/ui/PageHeader'
import AlertCard from '../../components/supply/AlertCard'
import AlertFeed from '../../components/supply/AlertFeed'
import TransferSuggestionCard from '../../components/supply/TransferSuggestionCard'

const severityToLevel = {
  red: 'critical',
  yellow: 'warning',
  green: 'normal',
}

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([])
  const [redistributions, setRedistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approvingKey, setApprovingKey] = useState('')

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

  const handleApprove = async (item, key) => {
    try {
      setApprovingKey(key)
      setError('')

      await apiFetch('/insights/redistribution/approve', {
        method: 'POST',
        body: JSON.stringify({
          drugId: item.drug?._id || item.drug,
          fromHospitalId: item.fromHospital?._id || item.fromHospital,
          toHospitalId: item.toHospital?._id || item.toHospital,
          quantity: item.suggestedQuantity,
        }),
      })

      // Remove the approved recommendation from the current view.
      setRedistributions((current) =>
        current.filter((_, index) => {
          const currentKey = `${redistributions[index]?.drug?._id || redistributions[index]?.drug}-${redistributions[index]?.fromHospital?._id ||
            redistributions[index]?.fromHospital
            }-${redistributions[index]?.toHospital?._id ||
            redistributions[index]?.toHospital
            }-${index}`

          return currentKey !== key
        })
      )
    } catch (err) {
      setError(err.message || 'Could not approve redistribution')
    } finally {
      setApprovingKey('')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="System-wide notifications and critical alerts"
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

      {!loading && !error && (
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest2 text-ink-faint">
            Redistribution recommendations
          </h2>

          {redistributions.map((item, index) => {
            const key = `${item.drug?._id || item.drug}-${item.fromHospital?._id || item.fromHospital
              }-${item.toHospital?._id || item.toHospital}-${index}`

            return (
              <TransferSuggestionCard
                key={key}
                drug={item.drug?.name || item.drug}
                qty={item.suggestedQuantity}
                from={item.fromHospital?.name || item.fromHospital}
                to={item.toHospital?.name || item.toHospital}
                batch={item.batch || '—'}
                reason={item.reason}
                onApprove={() => handleApprove(item, key)}
                approving={approvingKey === key}
              />
            )
          })}
        </section>
      )}
    </div>
  )
}