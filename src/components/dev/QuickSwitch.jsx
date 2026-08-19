import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown, Zap, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api'

// Emails and passwords are fixed by utils/seed.js and never change across
// reseeds. The `label` (display name) DOES change every time `npm run seed`
// runs, because seed.js uses faker to generate a random company/hospital
// name for each vendor/hospital. So instead of hardcoding labels here (which
// goes stale the moment someone reseeds), we fetch the current real names
// from GET /api/auth/demo-accounts on mount and merge them with the fixed
// email/password pairs below.

const PASSWORD_BY_ROLE = {
  admin: 'admin123',
  hospital: 'hospital123',
  vendor: 'vendor123',
}

// Fallback labels used only until the fetch resolves (or if it fails) —
// prevents a blank menu on first paint / offline dev.
const FALLBACK_ADMIN = { label: 'Admin', email: 'admin@pss04.gov.in', password: 'admin123' }
const FALLBACK_HOSPITALS = [
  { label: 'ALlen District', email: 'hospital1@pss04.gov.in', password: 'hospital123' },
  { label: 'Hospital 2', email: 'hospital2@pss04.gov.in', password: 'hospital123' },
  { label: 'Hospital 3', email: 'hospital3@pss04.gov.in', password: 'hospital123' },
]
const FALLBACK_VENDORS = [
  { label: 'Vendor 1', email: 'vendor1@pss04.gov.in', password: 'vendor123' },
  { label: 'Vendor 2', email: 'vendor2@pss04.gov.in', password: 'vendor123' },
  { label: 'Vendor 3', email: 'vendor3@pss04.gov.in', password: 'vendor123' },
  { label: 'Vendor 4', email: 'vendor4@pss04.gov.in', password: 'vendor123' },
  { label: 'Vendor 5', email: 'vendor5@pss04.gov.in', password: 'vendor123' },
]

function AccountButton({ account, switching, onSwitch }) {
  return (
    <button
      onClick={() => onSwitch(account)}
      disabled={switching !== null}
      className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
    >
      <span className="truncate">{account.label}</span>
      {switching === account.email ? (
        <span className="text-[11px] text-slate-400 shrink-0">Switching…</span>
      ) : (
        <LogIn size={13} className="text-slate-300 shrink-0" />
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

  const [adminAccount, setAdminAccount] = useState(FALLBACK_ADMIN)
  const [hospitalAccounts, setHospitalAccounts] = useState(FALLBACK_HOSPITALS)
  const [vendorAccounts, setVendorAccounts] = useState(FALLBACK_VENDORS)

  // Fetch current real names once on mount. Safe to call even when logged
  // out — the endpoint is public and only used by this dev component.
  useEffect(() => {
    let cancelled = false

    async function loadDemoAccounts() {
      try {
        const accounts = await apiFetch('/auth/demo-accounts')
        if (cancelled || !Array.isArray(accounts)) return

        const withPassword = accounts.map((a) => ({
          label: a.label,
          email: a.email,
          password: PASSWORD_BY_ROLE[a.role] || '',
        }))

        const admin = withPassword.find((a) => a.email === 'admin@pss04.gov.in')
        const hospitals = withPassword.filter((a) => a.email.startsWith('hospital'))
        const vendors = withPassword.filter((a) => a.email.startsWith('vendor'))

        if (admin) setAdminAccount(admin)
        if (hospitals.length) setHospitalAccounts(hospitals)
        if (vendors.length) setVendorAccounts(vendors)
      } catch (err) {
        // Fall back silently to the placeholder labels above — login still
        // works fine since emails/passwords are correct either way, only
        // the displayed name might read generically ("Vendor 1" etc).
        console.warn('QuickSwitch: could not load current demo account names', err)
      }
    }

    loadDemoAccounts()
    return () => { cancelled = true }
  }, [])

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
    sectionAccounts = hospitalAccounts
    sectionLabel = 'Hospitals'
  } else if (onVendorPages) {
    sectionAccounts = vendorAccounts
    sectionLabel = 'Vendors'
  } else {
    sectionAccounts = [...hospitalAccounts, ...vendorAccounts]
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
                <AccountButton account={adminAccount} switching={switching} onSwitch={switchTo} />
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
                <AccountButton account={adminAccount} switching={switching} onSwitch={switchTo} />
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