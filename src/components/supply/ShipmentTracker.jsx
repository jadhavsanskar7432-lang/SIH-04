export default function ShipmentTracker({
  order,
  drug,
  vendor,
  steps = [],
  currentStep = 0,
  delayDays,
  etaOriginal,
  etaNow,
}) {
  return (
    <div className="w-full max-w-sm rounded-md border border-line bg-white/70 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
          {order}
        </span>
        {delayDays ? (
          <span className="rounded-full bg-coral-soft px-2 py-0.5 font-mono text-[10px] text-coral">
            delayed +{delayDays}d
          </span>
        ) : (
          <span className="rounded-full bg-moss-soft px-2 py-0.5 font-mono text-[10px] text-moss">
            on time
          </span>
        )}
      </div>

      <p className="mt-2.5 font-display text-[17px] font-medium text-ink">{drug}</p>
      <p className="font-mono text-[11px] text-ink-faint">{vendor}</p>

      <ol className="mt-4 space-y-0" aria-label="Shipment status">
        {steps.map((s, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <li key={s} className="relative flex items-start gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  className={`absolute left-[5px] top-3 h-full w-px ${
                    done ? 'bg-amber' : 'bg-line'
                  }`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${
                  done || active
                    ? 'border-amber bg-amber'
                    : 'border-line bg-white'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-[12.5px] leading-tight ${
                  active ? 'font-semibold text-ink' : done ? 'text-ink-soft' : 'text-ink-faint'
                }`}
              >
                {s}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-1 flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-ink-soft">
        <span>ETA was {etaOriginal}</span>
        <span className={delayDays ? 'text-coral' : ''}>now {etaNow}</span>
      </div>
    </div>
  )
}
