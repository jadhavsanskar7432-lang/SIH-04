/**
 * Consistent empty-state block for lists/tables with nothing to show.
 *
 *   <EmptyState
 *     icon={Package}
 *     title="No batches yet"
 *     description="Stock you receive from vendors will show up here."
 *   />
 *
 * `action` is optional — pass a <button>/<Link> to give the user a next
 * step (e.g. "Create order").
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <Icon size={20} />
        </div>
      )}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
