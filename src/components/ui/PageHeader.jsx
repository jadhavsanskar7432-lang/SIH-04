/**
 * Shared page header. `title`/`description` keep the exact same contract
 * every existing caller already uses. `eyebrow` and `action` are optional
 * additions — omitting them renders exactly as before, just restyled to
 * match the eyebrow-label pattern already used across Admin/Hospital pages.
 */
export default function PageHeader({ title, description, eyebrow, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
