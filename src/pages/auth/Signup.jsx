import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ShieldCheck,
  Building2,
  Truck,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Syringe,
  Pill,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  ClipboardList,
} from 'lucide-react'

const roles = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Manage platform operations, users and system workflows.',
    icon: ShieldCheck,
    accent: '#D9FF6A',
  },
  {
    id: 'hospital',
    label: 'Hospital',
    description: 'Manage hospital operations, orders and healthcare workflows.',
    icon: Building2,
    accent: '#5EEAD4',
  },
  {
    id: 'vendor',
    label: 'Vendor',
    description: 'Manage products, orders, inventory and shipments.',
    icon: Truck,
    accent: '#FCD34D',
  },
]

function MedicalIcon({ icon: Icon, className = '', size = 32 }) {
  // Pseudo-random stagger derived from `size` (already varies per instance)
  // so each icon drifts on its own rhythm without a separate delay prop.
  const delay = (size % 7) * 300
  const duration = 5 + (size % 5)
  return (
    <span className={`absolute ${className}`}>
      <span
        className="block animate-icon-float"
        style={{ animationDelay: `${delay}ms`, animationDuration: `${duration}s` }}
      >
        <Icon size={size} strokeWidth={1.4} />
      </span>
    </span>
  )
}

function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[#f7f2e7]">
      {/* Warm cream base with a soft brand-tinted glow through the middle */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fdfaf3] via-[#f7f2e7] to-[#f0ead9]" />
      <div
        className="absolute left-1/2 top-[36%] h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(15,77,70,0.10) 0%, rgba(15,77,70,0.04) 45%, transparent 70%)',
        }}
      />
      <div className="absolute -top-28 right-[-7rem] h-80 w-80 rounded-full bg-accent-300/30 blur-3xl" />
      <div className="absolute bottom-[-6rem] left-[-5rem] h-72 w-72 rounded-full bg-brand-900/[0.08] blur-3xl" />
      <div className="absolute top-[22%] left-[-3rem] h-56 w-56 rounded-full bg-accent-200/25 blur-3xl" />

      {/* Scattered medical/pharma iconography, kept to the corners so the
          auth card stays clear, but bumped up in size/opacity/variety so
          it actually reads against the cream backdrop. */}
      <MedicalIcon icon={Syringe} size={42} className="left-[5%] top-[8%] rotate-[-18deg] text-brand-900/[0.16]" />
      <MedicalIcon icon={Pill} size={30} className="left-[16%] top-[21%] rotate-[12deg] text-brand-700/[0.15]" />
      <MedicalIcon icon={Stethoscope} size={38} className="left-[3%] top-[39%] text-brand-900/[0.15]" />
      <MedicalIcon icon={FlaskConical} size={32} className="left-[13%] top-[56%] rotate-[8deg] text-brand-700/[0.14]" />
      <MedicalIcon icon={ClipboardList} size={34} className="left-[4%] top-[73%] rotate-[-6deg] text-brand-900/[0.14]" />
      <MedicalIcon icon={HeartPulse} size={26} className="left-[10%] top-[89%] text-brand-700/[0.13]" />

      <MedicalIcon icon={HeartPulse} size={40} className="right-[5%] top-[12%] text-brand-900/[0.16]" />
      <MedicalIcon icon={Pill} size={28} className="right-[13%] top-[29%] rotate-[24deg] text-brand-700/[0.15]" />
      <MedicalIcon icon={ClipboardList} size={34} className="right-[4%] top-[51%] rotate-[-10deg] text-brand-900/[0.14]" />
      <MedicalIcon icon={Stethoscope} size={32} className="right-[14%] top-[70%] rotate-[6deg] text-brand-900/[0.14]" />
      <MedicalIcon icon={Syringe} size={30} className="right-[7%] top-[87%] rotate-[18deg] text-brand-700/[0.13]" />

      <div
        className="absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,61,58,0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 72% 58% at 50% 38%, black 25%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 72% 58% at 50% 38%, black 25%, transparent 100%)',
        }}
      />
      <style>{`
        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up { animation: fade-slide-up 0.35s ease-out both; }
        @keyframes fade-slide-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-slide-in { animation: fade-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes icon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        .animate-icon-float { animation: icon-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-icon-float { animation: none; }
        }
      `}</style>
    </div>
  )
}

function RoleCard({ role, index, onSelect }) {
  const Icon = role.icon
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-fade-slide-up group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/[0.10] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
    >
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ backgroundColor: role.accent }}
      />

      <Icon
        size={116}
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-6 -right-6 text-brand-900/[0.05] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6"
      />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-900 shadow-sm transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3" style={{ color: role.accent }}>
        <Icon size={25} />
      </div>
      <div className="relative">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{role.label}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{role.description}</p>
      </div>
      <span className="relative mt-1 flex items-center gap-1 text-xs font-semibold opacity-0 transition-all duration-300 group-hover:opacity-100" style={{ color: role.accent === '#D9FF6A' ? '#5C6B24' : role.accent }}>
        Continue
        <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
      <span className="pointer-events-none absolute inset-x-6 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-accent-300 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
    </button>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    contact: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const selectedRoleInfo = roles.find((r) => r.id === selectedRole)

  const handleSelectRole = (roleId) => {
    setError('')
    setSelectedRole(roleId)
  }

  const handleBack = () => {
    setError('')
    setSelectedRole(null)
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your name.'
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!form.location.trim()) return 'Please enter a location.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: selectedRole,
      location: form.location.trim(),
      contact: form.contact.trim() || undefined,
    })
    setSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <AmbientBackground />

      <div className={`relative z-10 w-full ${selectedRole ? 'max-w-md' : 'max-w-3xl'}`}>
        <div className="mb-10 flex animate-fade-slide-up flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 text-accent-300 shadow-lg shadow-brand-900/25 ring-1 ring-white/40 transition-transform duration-300 hover:scale-105">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            MedSupply <span className="bg-gradient-to-r from-brand-900 to-brand-700 bg-clip-text text-transparent">Chain</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {selectedRole ? `Create your ${selectedRoleInfo?.label} account` : 'Choose your role to sign up'}
          </p>
        </div>

        {!selectedRole ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {roles.map((role, index) => (
                <RoleCard key={role.id} role={role} index={index} onSelect={handleSelectRole} />
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-brand-800 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <div className="animate-fade-slide-in mx-auto w-full max-w-sm">
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-brand-900/[0.08] ring-1 ring-brand-900/[0.03] backdrop-blur-sm">
              <button
                type="button"
                onClick={handleBack}
                className="mb-4 flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-500 transition-colors hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-900 text-accent-300">
                  {selectedRoleInfo && <selectedRoleInfo.icon size={18} />}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {selectedRoleInfo?.label} Sign Up
                  </h2>
                  <p className="text-xs text-slate-400">Create your account to get started</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10"
                    placeholder={selectedRole === 'admin' ? 'Your name' : `${selectedRoleInfo?.label} name`}
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10"
                    placeholder="Enter email"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-location" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <input
                    id="signup-location"
                    type="text"
                    value={form.location}
                    onChange={update('location')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10"
                    placeholder="City / area"
                    autoComplete="address-level2"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-contact" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Contact number <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="signup-contact"
                    type="tel"
                    value={form.contact}
                    onChange={update('contact')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10"
                    placeholder="Phone number"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={update('password')}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={update('confirmPassword')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-900/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand-900/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand-800 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}