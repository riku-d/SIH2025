import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function readUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Single source of truth for auth. Previously Navbar, PrivateRoute and
 * nine components each read localStorage directly on render with no
 * subscription, so the header could show stale identity after login.
 * Storage keys are unchanged, so the API contract is untouched.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))

  const login = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Keep tabs in sync, and pick up the forced logout the 401 interceptor performs.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        setToken(localStorage.getItem(TOKEN_KEY))
        setUser(readUser())
      }
    }
    const onUnauthorized = () => { setToken(null); setUser(null) }
    window.addEventListener('storage', onStorage)
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('auth:unauthorized', onUnauthorized)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    token,
    userId: user?.id || user?._id || null,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    updateUser
  }), [user, token, login, logout, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
