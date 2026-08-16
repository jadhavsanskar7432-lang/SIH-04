import { ArrowRight } from 'lucide-react'

export default function TransferSuggestionCard({ drug, qty, from, to, batch, reason, onApprove }) {
  return (
    <div className="w-full max-w-sm rounded-md border border-line bg-white/70 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">
          Suggested transfer
        </span>
        <span className="font-mono text-[10px] text-ink-faint">batch {batch}</span>
      </div>

      <p className="mt-2.5 font-display text-[17px] font-medium text-ink">{drug}</p>

      <div className="mt-3 flex items-center gap-2 rounded bg-paper-dim px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[12px] text-ink-soft">{from}</p>
          <p className="font-mono text-[10px] text-ink-faint">has spare</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-[12px] text-ink-soft">{to}</p>
          <p className="font-mono text-[10px] text-ink-faint">needs {qty}</p>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">{reason}</p>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-[13px] font-semibold text-ink">{qty} units</span>
        <button
          type="button"
          onClick={onApprove}
          disabled={!onApprove}
          className="rounded border border-amber/40 bg-amber/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-amber transition-colors hover:bg-amber/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve transfer
        </button>
      </div>
    </div>
  )
}
