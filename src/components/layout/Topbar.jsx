import { Menu, LogOut, Search, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-line bg-paper px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-soft hover:bg-white lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="relative hidden max-w-xs flex-1 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Search…"
          className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-amber"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-full p-2 text-ink-soft hover:bg-white">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-coral" />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="text-xs capitalize text-ink-faint">{user?.role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-panel text-sm font-semibold text-amber">
          {user?.name?.charAt(0)}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}