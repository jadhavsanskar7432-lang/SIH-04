const dot = {
  critical: 'bg-coral',
  warning: 'bg-gold',
  normal: 'bg-moss',
}

export default function AlertFeed({ items = [], action }) {
  return (
    <div className="w-full max-w-sm rounded-md border border-line bg-white/70 shadow-card">
      <div className="border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
          Alert feed
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 px-4 py-2.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot[item.level]}`} aria-hidden="true" />
            <span className="text-[12.5px] leading-snug text-ink-soft">{item.text}</span>
          </li>
        ))}
      </ul>
      {action && (
        <div className="border-t border-line px-4 py-3">
          <button
            type="button"
            className="w-full rounded border border-amber/40 bg-amber/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-amber transition-colors hover:bg-amber/20"
          >
            {action}
          </button>
        </div>
      )}
    </div>
  )
}
