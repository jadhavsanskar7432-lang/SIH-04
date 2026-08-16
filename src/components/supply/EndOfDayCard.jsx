export default function EndOfDayCard({ healthScore, shortagesPrevented, activeShipments, arrivingTomorrow }) {
  const stats = [
    { label: 'Stock health', value: `${healthScore}%`, emphasis: true },
    { label: 'Shortages prevented today', value: shortagesPrevented },
    { label: 'Shipments in transit', value: activeShipments },
    { label: 'Arriving tomorrow', value: arrivingTomorrow },
  ]

  return (
    <div className="w-full max-w-sm rounded-md border border-line bg-white/70 p-4 shadow-card">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
        Admin · end of day
      </span>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="font-mono text-[10.5px] leading-tight text-ink-faint">{s.label}</dt>
            <dd
              className={`mt-1 font-display font-semibold ${
                s.emphasis ? 'text-3xl text-amber' : 'text-2xl text-ink'
              }`}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
