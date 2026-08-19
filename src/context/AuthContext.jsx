import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../api'
import { connectSocket, getSocket } from '../socket'

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

  // Join the socket.io room for this user (role/user-scoped live updates)
  // whenever we have a logged-in user — covers both fresh logins and
  // page reloads that restore the session from localStorage.
  useEffect(() => {
    if (user) connectSocket(user)
  }, [user])

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

  const register = async (payload) => {
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setUser(data.user)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
      localStorage.setItem(TOKEN_KEY, data.token)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    getSocket().disconnect()
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}