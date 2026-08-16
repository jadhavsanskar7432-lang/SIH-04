export default function StatCard({ label, value, icon: Icon, accent = 'indigo' }) {
  const accentMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-lg p-2.5 ${accentMap[accent]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}