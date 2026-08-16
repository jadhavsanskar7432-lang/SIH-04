import { useState } from 'react'
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck } from 'lucide-react'

const demoAccounts = [
  { role: 'Admin', username: 'admin', password: 'admin123' },
  { role: 'Hospital', username: 'hospital', password: 'hospital123' },
  { role: 'Vendor', username: 'vendor', password: 'vendor123' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = login(username, password)
    if (!result.success) {
      setError(result.message)
      return
    }
    const from = location.state?.from?.pathname
    navigate(from || '/', { replace: true })
  }

  const fillDemo = (acc) => {
    setUsername(acc.username)
    setPassword(acc.password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-panel text-amber">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink">MedSupply Chain</h1>
          <p className="mt-1 text-sm text-ink-faint">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-panel py-2.5 text-sm font-medium text-amber transition-colors hover:bg-panel-soft"
            >
              Sign in
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-white p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Demo Accounts
          </p>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                onClick={() => fillDemo(acc)}
                className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-sm hover:bg-paper"
              >
                <span className="font-medium text-ink-soft">{acc.role}</span>
                <span className="text-ink-faint">{acc.username}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-faint">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-ink hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}