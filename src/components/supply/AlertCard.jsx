import { TriangleAlert } from 'lucide-react'

const levelStyles = {
  warning: { bg: 'bg-gold-soft', text: 'text-gold', ring: 'ring-gold/30', dot: 'bg-gold' },
  critical: { bg: 'bg-coral-soft', text: 'text-coral', ring: 'ring-coral/30', dot: 'bg-coral' },
  normal: { bg: 'bg-moss-soft', text: 'text-moss', ring: 'ring-moss/30', dot: 'bg-moss' },
}

export default function AlertCard({ level = 'warning', drug, hospital, detail, eta }) {
  const s = levelStyles[level] ?? levelStyles.warning

  return (
    <div
      className={`w-full max-w-sm rounded-md border border-line bg-white/70 p-4 shadow-card ring-1 ${s.ring}`}
      role="group"
      aria-label={`${level} alert for ${drug}`}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
        <span className={`font-mono text-[10px] uppercase tracking-widest2 ${s.text}`}>
          {level === 'critical' ? 'Critical' : level === 'warning' ? 'Warning' : 'Normal'}
        </span>
        <TriangleAlert className={`ml-auto h-3.5 w-3.5 ${s.text}`} aria-hidden="true" />
      </div>
      <p className="mt-2.5 font-display text-[17px] font-medium leading-snug text-ink">{drug}</p>
      <p className="font-mono text-[11px] text-ink-faint">{hospital}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{detail}</p>
      {eta && (
        <p className="mt-3 border-t border-line pt-2 font-mono text-[11px] text-ink-soft">{eta}</p>
      )}
    </div>
  )
}
