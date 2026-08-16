import { NavLink } from 'react-router-dom'

export default function Sidebar({ navItems, basePath, roleLabel, open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-30 flex h-full w-64 flex-col bg-panel transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber text-sm font-bold text-panel">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-paper">MedSupply</p>
            <p className="text-[11px] text-paper/50">{roleLabel} Panel</p>
          </div>
        </div>

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
                      ? 'bg-amber text-panel'
                      : 'text-paper/65 hover:bg-panel-soft hover:text-paper'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}