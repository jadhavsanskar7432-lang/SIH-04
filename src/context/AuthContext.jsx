import { createContext, useContext, useEffect, useState } from 'react'
import { mockUsers } from '../data/mockUsers'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sih_auth_user'

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

  const login = (username, password) => {
    const match = mockUsers.find(
      (u) => u.username === username && u.password === password
    )
    if (!match) {
      return { success: false, message: 'Invalid username or password' }
    }
    const { password: _pw, ...safeUser } = match
    setUser(safeUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser))
    return { success: true, user: safeUser }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
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