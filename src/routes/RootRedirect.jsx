import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RootRedirect() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'hospital':
      return <Navigate to="/hospital" replace />
    case 'vendor':
      return <Navigate to="/vendor" replace />
    default:
      return <Navigate to="/login" replace />
  }
}