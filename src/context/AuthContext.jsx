import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sih_auth_user'
const TOKEN_KEY = 'sih_auth_user_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(data.user)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
      localStorage.setItem(TOKEN_KEY, data.token)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}