import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <ShieldAlert className="mb-4 text-rose-500" size={40} />
      <h1 className="text-xl font-semibold text-slate-900">Access Denied</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        You don't have permission to view this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}