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
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-popover">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {order}
        </span>
        {delayDays ? (
          <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[10px] font-semibold text-danger-600">
            delayed +{delayDays}d
          </span>
        ) : (
          <span className="rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-600">
            on time
          </span>
        )}
      </div>

      <p className="mt-2.5 text-[17px] font-semibold text-slate-900">{drug}</p>
      <p className="text-[11px] text-slate-400">{vendor}</p>

      <ol className="mt-4 space-y-0" aria-label="Shipment status">
        {steps.map((s, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <li key={s} className="relative flex items-start gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  className={`absolute left-[5px] top-3 h-full w-px transition-colors duration-300 ${
                    done ? 'bg-accent-300' : 'bg-slate-200'
                  }`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 transition-colors duration-300 ${
                  done || active
                    ? 'border-accent-300 bg-accent-300'
                    : 'border-slate-200 bg-white'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-[12.5px] capitalize leading-tight ${
                  active
                    ? 'font-semibold text-slate-900'
                    : done
                    ? 'text-slate-600'
                    : 'text-slate-400'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span>ETA was {etaOriginal}</span>
        <span className={delayDays ? 'font-semibold text-danger-600' : ''}>now {etaNow}</span>
      </div>
    </div>
  )
}
