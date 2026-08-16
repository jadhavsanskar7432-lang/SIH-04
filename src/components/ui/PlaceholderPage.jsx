import PageHeader from './PageHeader'

export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
        <p className="text-sm text-slate-400">{title} module coming soon</p>
      </div>
    </div>
  )
}