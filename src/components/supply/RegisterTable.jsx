export default function RegisterTable({ title, rows = [] }) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-md border border-line bg-white/70 shadow-card">
      <div className="border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
          {title}
        </span>
      </div>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            <th scope="col" className="px-4 py-2 font-medium">Batch</th>
            <th scope="col" className="px-2 py-2 font-medium">Drug</th>
            <th scope="col" className="px-2 py-2 font-medium">Expiry</th>
            <th scope="col" className="px-2 py-2 font-medium text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.batch}
              className={`border-b border-line last:border-0 ${
                r.flag ? 'bg-gold-soft/50' : ''
              }`}
            >
              <td className="px-4 py-2.5 font-mono text-[11.5px] text-ink">{r.batch}</td>
              <td className="px-2 py-2.5 text-[12px] text-ink-soft">{r.drug}</td>
              <td className="px-2 py-2.5 font-mono text-[11.5px] text-ink-soft">{r.expiry}</td>
              <td className="px-2 py-2.5 text-right font-mono text-[11.5px] text-ink-soft">
                {r.qty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.some((r) => r.flag) && (
        <div className="border-t border-line bg-gold-soft/40 px-4 py-2">
          <p className="font-mono text-[10.5px] text-gold">
            ↑ {rows.find((r) => r.flag)?.flag}
          </p>
        </div>
      )}
    </div>
  )
}
