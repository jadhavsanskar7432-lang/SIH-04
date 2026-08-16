export default function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      )}
    </div>
  )
}