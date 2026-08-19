import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown, Zap, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// Matches utils/seed.js exactly: 1 admin, 3 hospitals, 5 vendors, fixed
// passwords per role. Demo/dev convenience only.
const ADMIN_ACCOUNT = { label: 'Admin', email: 'admin@pss04.gov.in', password: 'admin123' }

const HOSPITAL_ACCOUNTS = [
  { label: 'Schultzshire District', email: 'hospital1@pss04.gov.in', password: 'hospital123' },
  { label: 'Cortneyton District', email: 'hospital2@pss04.gov.in', password: 'hospital123' },
  { label: 'Beerworth District', email: 'hospital3@pss04.gov.in', password: 'hospital123' },
]

const VENDOR_ACCOUNTS = [
  { label: 'Littel - Roob', email: 'vendor1@pss04.gov.in', password: 'vendor123' },
  { label: 'Rau - McGlynn', email: 'vendor2@pss04.gov.in', password: 'vendor123' },
  { label: 'Mueller, Hickle and Thiel', email: 'vendor3@pss04.gov.in', password: 'vendor123' },
  { label: 'Nienow - Zieme', email: 'vendor4@pss04.gov.in', password: 'vendor123' },
  { label: 'Tillman, Grant and Koch', email: 'vendor5@pss04.gov.in', password: 'vendor123' },
]

function AccountButton({ account, switching, onSwitch }) {
  return (
    <button
      onClick={() => onSwitch(account)}
      disabled={switching !== null}
      className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
    >
      <span>{account.label}</span>
      {switching === account.email ? (
        <span className="text-[11px] text-slate-400">Switching…</span>
      ) : (
        <LogIn size={13} className="text-slate-300" />
      )}
    </button>
  )
}

export default function QuickSwitch() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(null) // email currently switching to

  // Context-aware: on a Hospital page, only show the 3 hospital accounts
  // (quickly cycle between hospitals to compare their data). On a Vendor
  // page, only the 5 vendor accounts. Admin is always available too, as
  // the way back to "jump anywhere." Anywhere else (Admin pages, login,
  // etc.) shows the full list.
  const onHospitalPages = location.pathname.startsWith('/hospital')
  const onVendorPages = location.pathname.startsWith('/vendor')

  let sectionAccounts
  let sectionLabel
  if (onHospitalPages) {
    sectionAccounts = HOSPITAL_ACCOUNTS
    sectionLabel = 'Hospitals'
  } else if (onVendorPages) {
    sectionAccounts = VENDOR_ACCOUNTS
    sectionLabel = 'Vendors'
  } else {
    sectionAccounts = [...HOSPITAL_ACCOUNTS, ...VENDOR_ACCOUNTS]
    sectionLabel = 'All accounts'
  }

  async function switchTo(account) {
    setSwitching(account.email)
    if (user) logout()
    const result = await login(account.email, account.password)
    setSwitching(null)
    setOpen(false)
    if (result.success) {
      navigate('/', { replace: true })
    } else {
      alert(`Could not switch to ${account.label}: ${result.message}`)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-popover animate-scale-in origin-bottom-right">
          <div className="border-b border-slate-100 px-3.5 py-2.5">
            <p className="text-xs font-semibold text-slate-700">Quick switch (demo)</p>
            <p className="text-[11px] text-slate-400">
              {user ? `Currently: ${user.name}` : 'Not logged in'}
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {/* Admin pinned at top — always the way back, unless we're
                already showing the full list */}
            {(onHospitalPages || onVendorPages) && (
              <>
                <AccountButton account={ADMIN_ACCOUNT} switching={switching} onSwitch={switchTo} />
                <div className="my-1 border-t border-slate-100" />
              </>
            )}

            <p className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {sectionLabel}
            </p>
            {sectionAccounts.map((account) => (
              <AccountButton key={account.email} account={account} switching={switching} onSwitch={switchTo} />
            ))}

            {!onHospitalPages && !onVendorPages && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <p className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Admin
                </p>
                <AccountButton account={ADMIN_ACCOUNT} switching={switching} onSwitch={switchTo} />
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-brand-900 px-4 py-2.5 text-xs font-semibold text-white shadow-popover transition-transform active:scale-95"
      >
        <Zap size={14} />
        Quick switch
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  )
}
