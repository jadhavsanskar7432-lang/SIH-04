import { useApp } from '../context/AppContext.jsx'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded border border-line bg-ink px-4 py-2.5 font-mono text-[12px] text-paper shadow-cardDark"
    >
      {toast}
    </div>
  )
}
