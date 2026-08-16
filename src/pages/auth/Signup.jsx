import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { UserPlus } from 'lucide-react'

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'vendor', label: 'Vendor' },
]

export default function Signup() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('hospital')
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const result = register({ name, username, password, role })
    if (!result.success) {
      setError(result.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-panel text-amber">
            <UserPlus size={24} />
          </div>
          <h1 className="text-xl font-semibold text-ink">Create an account</h1>
          <p className="mt-1 text-sm text-ink-faint">Set up your MedSupply Chain login</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      role === r.value
                        ? 'border-panel bg-panel text-amber'
                        : 'border-line text-ink-soft hover:bg-paper'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
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
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                placeholder="Re-enter password"
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
              Create account
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-faint">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}