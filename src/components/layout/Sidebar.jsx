import { NavLink } from 'react-router-dom'
import { Package, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const CANVAS_BG = '#070F0B' // gutter visible around the floating card
const LIME_FROM = '#D9FF6A'
const LIME_TO = '#C6F24A'
const LIME_TEXT = '#0B1F17'

export default function Sidebar({ navItems, basePath, roleLabel, open, onClose }) {
  const { logout } = useAuth()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 animate-fade-in bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Outer element keeps the existing slide/translate logic untouched —
          it's just the dark canvas the rounded card floats on. */}
      <aside
        style={{ backgroundColor: CANVAS_BG }}
        className={`fixed z-30 h-full w-64 p-2.5 transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] shadow-[0_0_0_1px_rgba(217,255,106,0.04),0_24px_48px_-16px_rgba(0,0,0,0.55)]"
          style={{ backgroundImage: 'linear-gradient(160deg, #0F2A22 0%, #0B1F17 100%)' }}
        >
          {/* Watermark — large faint brand mark, purely decorative depth */}
          <Package
            size={280}
            strokeWidth={0.6}
            className="pointer-events-none absolute -bottom-16 -right-20 rotate-[-12deg] text-white/[0.025]"
          />
          <Package
            size={140}
            strokeWidth={0.8}
            className="pointer-events-none absolute -top-8 -left-10 rotate-[18deg] text-white/[0.02]"
          />

          {/* LOGO */}
          <div className="flex h-16 items-center gap-2.5 px-[18px]">
            <div
              style={{ backgroundImage: `linear-gradient(135deg, ${LIME_FROM}, ${LIME_TO})`, color: LIME_TEXT }}
              className="flex h-9 w-9 items-center justify-center rounded-lg"
            >
              <Package size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">MedSupply</p>
              <p className="text-xs text-[#AFC5B7]">{roleLabel} Panel</p>
            </div>
          </div>

          {/* NAV */}
          <nav className="themed-scrollbar flex-1 space-y-1.5 overflow-y-auto px-3.5 py-3">
            {navItems.map((item) => {
              const to = item.path ? `${basePath}/${item.path}` : basePath
              const Icon = item.icon
              return (
                <NavLink
                  key={item.label}
                  to={to}
                  end={item.path === ''}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 py-[13px] text-sm font-medium transition-all duration-[220ms] ease-out ${
                      isActive
                        ? 'sidebar-active-glow rounded-full px-[18px] font-semibold'
                        : 'rounded-xl px-4 text-[#E6F1EA]/60 hover:translate-x-1 hover:bg-[#102E25] hover:text-white'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          backgroundImage: `linear-gradient(135deg, ${LIME_FROM}, ${LIME_TO})`,
                          color: LIME_TEXT,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
                        }
                      : undefined
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Left indicator bar — hover-only, inactive items */}
                      {!isActive && (
                        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 scale-y-0 rounded-full bg-[#D9FF6A] opacity-0 transition-all duration-200 ease-out group-hover:scale-y-100 group-hover:opacity-100" />
                      )}
                      <Icon size={19} strokeWidth={1.8} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      {item.label}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* FOOTER / LOGOUT */}
          <div className="border-t border-white/[0.06] px-3.5 py-3.5">
            <button
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-[13px] text-sm font-medium text-[#E6F1EA]/60 transition-all duration-[220ms] ease-out hover:bg-[#FF6B6B]/[0.08] hover:text-[#FF6B6B] active:scale-[0.98]"
            >
              <LogOut size={19} strokeWidth={1.8} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes sidebar-glow-pulse {
          0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0px rgba(217,255,106,0.0); }
          50% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 0 14px rgba(217,255,106,0.35); }
        }
        .sidebar-active-glow { animation: sidebar-glow-pulse 2.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sidebar-active-glow { animation: none; }
        }
      `}</style>
    </>
  )
}
