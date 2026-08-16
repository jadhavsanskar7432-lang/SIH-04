export default function StatCard({ label, value, icon: Icon, delta, dark = false }) {
  const isPositive = typeof delta === 'string' && delta.trim().startsWith('+')

  if (dark) {
    return (
      <div className="rounded-xl bg-panel p-5 text-paper">
        <div className="flex items-center justify-between">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber text-panel">
              <Icon size={16} />
            </div>
          )}
          {delta && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-amber">
              {delta}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-paper/60">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper-dim text-ink">
            <Icon size={16} />
          </div>
        )}
        {delta && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositive ? 'bg-moss-soft text-moss' : 'bg-coral-soft text-coral'
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-ink-faint">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  )
}