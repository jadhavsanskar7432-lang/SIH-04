import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api'
import { DARK } from '../../theme/adminColors'

const SEVERITY_DOT = {
  red: 'bg-rose-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, onOutside])
}

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role
  const isWired = role === 'admin' || role === 'hospital'

  // ── SEARCH ──────────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoaded, setSearchLoaded] = useState(false)

  // admin search sources
  const [hospitals, setHospitals] = useState([])
  const [vendors, setVendors] = useState([])

  // hospital search sources
  const [batches, setBatches] = useState([])
  const [hospitalOrders, setHospitalOrders] = useState([])

  const searchRef = useRef(null)
  useClickOutside(searchRef, () => setSearchOpen(false))

  useEffect(() => {
    if (!isWired) return
    async function loadSearchable() {
      try {
        if (role === 'admin') {
          const [h, v] = await Promise.all([
            apiFetch('/hospitals'),
            apiFetch('/vendors'),
          ])
          setHospitals(h)
          setVendors(v)
        } else if (role === 'hospital') {
          const [b, o] = await Promise.all([
            apiFetch('/batches'),
            apiFetch('/orders'),
          ])
          setBatches(b)
          setHospitalOrders(o)
        }
      } catch {
        // search becomes a no-op if this fails; not fatal
      } finally {
        setSearchLoaded(true)
      }
    }
    loadSearchable()
  }, [isWired, role])

  const term = query.trim().toLowerCase()

  // admin matches
  const matchedHospitals = term
    ? hospitals.filter((h) => h.name.toLowerCase().includes(term)).slice(0, 4)
    : []
  const matchedVendors = term
    ? vendors.filter((v) => v.name.toLowerCase().includes(term)).slice(0, 4)
    : []

  // hospital matches: dedupe batches by drug, match on drug name
  const matchedDrugs = term
    ? Object.values(
        batches
          .filter((b) => b.drug?.name?.toLowerCase().includes(term))
          .reduce((acc, b) => {
            const id = b.drug._id
            if (!acc[id]) acc[id] = { drug: b.drug, quantity: 0 }
            if (b.status === 'in_stock') acc[id].quantity += b.quantity
            return acc
          }, {})
      ).slice(0, 4)
    : []
  const matchedOrders = term
    ? hospitalOrders
        .filter((o) =>
          o.items?.some((it) => it.drug?.name?.toLowerCase().includes(term))
        )
        .slice(0, 4)
    : []

  const hasResults =
    role === 'admin'
      ? matchedHospitals.length > 0 || matchedVendors.length > 0
      : matchedDrugs.length > 0 || matchedOrders.length > 0

  function goTo(path) {
    setSearchOpen(false)
    setQuery('')
    navigate(path)
  }

  // ── NOTIFICATIONS ───────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(false)
  const notifRef = useRef(null)
  useClickOutside(notifRef, () => setNotifOpen(false))

  useEffect(() => {
    if (!isWired) return
    async function loadAlerts() {
      setAlertsLoading(true)
      try {
        // Auto-scoped server-side: admin sees all, hospital sees their own
        const data = await apiFetch('/insights/alerts')
        setAlerts(Array.isArray(data) ? data : [])
      } catch {
        setAlerts([])
      } finally {
        setAlertsLoading(false)
      }
    }
    loadAlerts()
  }, [isWired])

  const SEVERITY_ORDER = { red: 0, yellow: 1, green: 2 }
  const topAlerts = [...alerts]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 5)
  const urgentCount = alerts.filter(
    (a) => a.severity === 'red' || a.severity === 'yellow'
  ).length

  if (!isWired) {
    // Vendor (and any other future role): unchanged decorative topbar until
    // that section is built out.
    return (
      <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm text-slate-400 sm:flex">
          <Search size={16} />
          <span>Search...</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button className="relative rounded-full border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50">
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12281F] text-sm font-semibold text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-slate-900">
                {user?.name || 'User'}
              </p>
              <p className="text-xs capitalize leading-tight text-slate-400">
                {user?.role}
              </p>
            </div>
            <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* SEARCH */}
      <div ref={searchRef} className="relative hidden max-w-md flex-1 sm:block">
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={
              role === 'admin'
                ? 'Search hospitals or vendors...'
                : 'Search your drugs or orders...'
            }
            className="w-full bg-transparent outline-none placeholder:text-slate-400"
          />
        </div>

        {searchOpen && term && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {!searchLoaded && (
              <p className="px-3 py-2 text-xs text-slate-400">Loading…</p>
            )}

            {searchLoaded && !hasResults && (
              <p className="px-3 py-2 text-xs text-slate-400">
                No results for "{query}"
              </p>
            )}

            {role === 'admin' && matchedHospitals.length > 0 && (
              <div className="mb-1">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Hospitals
                </p>
                {matchedHospitals.map((h) => (
                  <button
                    key={h._id}
                    onClick={() => goTo('/admin/hospitals')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Building2 size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{h.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-slate-400">
                      {h.location}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {role === 'admin' && matchedVendors.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Vendors
                </p>
                {matchedVendors.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => goTo('/admin/vendors')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Users size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{v.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-slate-400">
                      {v.location}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {role === 'hospital' && matchedDrugs.length > 0 && (
              <div className="mb-1">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Your Inventory
                </p>
                {matchedDrugs.map(({ drug, quantity }) => (
                  <button
                    key={drug._id}
                    onClick={() => goTo('/hospital/inventory')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Package size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{drug.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-slate-400">
                      {quantity} in stock
                    </span>
                  </button>
                ))}
              </div>
            )}

            {role === 'hospital' && matchedOrders.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Your Orders
                </p>
                {matchedOrders.map((o) => (
                  <button
                    key={o._id}
                    onClick={() => goTo('/hospital/orders')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ShoppingCart size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                      {o.items?.map((it) => it.drug?.name).join(', ')}
                    </span>
                    <span className="ml-auto shrink-0 text-xs capitalize text-slate-400">
                      {o.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* NOTIFICATIONS */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-full border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
          >
            <Bell size={18} />
            {urgentCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  Stock alerts
                </p>
                {urgentCount > 0 && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                    {urgentCount} need attention
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {alertsLoading && (
                  <p className="px-4 py-4 text-sm text-slate-400">Loading…</p>
                )}

                {!alertsLoading && topAlerts.length === 0 && (
                  <p className="px-4 py-4 text-sm text-slate-400">
                    No stock alerts right now.
                  </p>
                )}

                {!alertsLoading &&
                  topAlerts.map((a, i) => (
                    <div
                      key={`${a.drug?._id || a.drug}-${a.hospital?._id || a.hospital}-${i}`}
                      className="flex items-start gap-2.5 border-b border-slate-50 px-4 py-3 last:border-0"
                    >
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          SEVERITY_DOT[a.severity] || 'bg-slate-300'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {a.drug?.name || a.drug}
                        </p>
                        {role === 'admin' && (
                          <p className="truncate text-xs text-slate-500">
                            {a.hospital?.name || a.hospital}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => {
                  setNotifOpen(false)
                  navigate(`/${role}/alerts`)
                }}
                className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2.5 text-xs font-semibold"
                style={{ color: DARK }}
              >
                <AlertTriangle size={12} />
                View all alerts
              </button>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12281F] text-sm font-semibold text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-slate-900">
              {user?.name || 'User'}
            </p>
            <p className="text-xs capitalize leading-tight text-slate-400">
              {user?.role}
            </p>
          </div>
          <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
        </div>
      </div>
    </header>
  )
}