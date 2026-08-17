import { NavLink } from 'react-router-dom'
import { Package, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const SIDEBAR_BG = '#12281F'
const LIME = '#D7FF5F'
const LIME_TEXT = '#1F2E14'

export default function Sidebar({ navItems, basePath, roleLabel, open, onClose }) {
  const { logout } = useAuth()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{ backgroundColor: SIDEBAR_BG }}
        className={`fixed z-30 flex h-full w-64 flex-col transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO */}
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div
            style={{ backgroundColor: LIME, color: LIME_TEXT }}
            className="flex h-9 w-9 items-center justify-center rounded-lg"
          >
            <Package size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">MedSupply</p>
            <p className="text-xs text-white/40">{roleLabel} Panel</p>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'font-semibold'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { backgroundColor: LIME, color: LIME_TEXT } : undefined
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* FOOTER / LOGOUT */}
        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
