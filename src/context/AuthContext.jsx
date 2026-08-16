import { createContext, useContext, useEffect, useState } from 'react'
import { mockUsers } from '../data/mockUsers'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sih_auth_user'
const REGISTERED_KEY = 'sih_registered_users'

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_KEY)) || []
  } catch {
    return []
  }
}

function getAllUsers() {
  return [...mockUsers, ...getRegisteredUsers()]
}

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
    const match = getAllUsers().find(
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

  const register = ({ name, username, password, role }) => {
    const trimmedUsername = username.trim().toLowerCase()

    if (!name.trim() || !trimmedUsername || !password || !role) {
      return { success: false, message: 'Please fill in every field' }
    }

    const exists = getAllUsers().some(
      (u) => u.username.toLowerCase() === trimmedUsername
    )
    if (exists) {
      return { success: false, message: 'That username is already taken' }
    }

    const registered = getRegisteredUsers()
    const newUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      username: trimmedUsername,
      password,
      role,
    }
    localStorage.setItem(REGISTERED_KEY, JSON.stringify([...registered, newUser]))

    const { password: _pw, ...safeUser } = newUser
    setUser(safeUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser))
    return { success: true, user: safeUser }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
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