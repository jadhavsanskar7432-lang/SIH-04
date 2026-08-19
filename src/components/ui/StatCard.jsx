const ACCENT_MAP = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  brand: 'bg-accent-300 text-brand-900',
}

/**
 * Shared stat/KPI card. Same prop contract used by every existing caller
 * (label, value, icon, accent) — `caption` is optional and additive, so
 * nothing currently rendering this breaks.
 */
export default function StatCard({ label, value, icon: Icon, accent = 'indigo', caption }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-popover">
      {Icon && (
        <Icon
          size={88}
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-4 -right-4 text-slate-900/[0.04] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6"
        />
      )}
      <div className="relative flex items-center justify-between">
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ACCENT_MAP[accent] || ACCENT_MAP.indigo}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="relative mt-4 text-sm text-slate-500">{label}</p>
      <p className="relative mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {caption && <p className="relative mt-1 text-xs text-slate-400">{caption}</p>}
    </div>
  )
}
