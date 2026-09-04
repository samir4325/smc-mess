import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ls_get, ls_set } from '../utils/storageHelpers'
import { SEED_DATA } from '../data/seed'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize seed data if first run
  useEffect(() => {
    if (!ls_get('initialized')) {
      Object.entries(SEED_DATA).forEach(([key, value]) => {
        ls_set(key, value)
      })
      ls_set('initialized', true)
    }
    // Restore session
    const saved = ls_get('session')
    if (saved) setCurrentUser(saved)
    setIsLoading(false)
  }, [])

  const loginCommittee = useCallback((name, enrollmentNumber) => {
    const users = ls_get('users') || []
    const user = users.find(
      u =>
        u.isActive &&
        u.enrollmentNumber &&
        u.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        u.enrollmentNumber.trim().toUpperCase() === enrollmentNumber.trim().toUpperCase()
    )
    if (!user) return { success: false, error: 'Invalid name or enrollment number.' }
    ls_set('session', user)
    setCurrentUser(user)
    return { success: true, user }
  }, [])

  const loginAdmin = useCallback((username, password) => {
    const users = ls_get('users') || []
    const user = users.find(
      u =>
        u.role === 'admin' &&
        u.isActive &&
        u.username?.trim().toLowerCase() === username.trim().toLowerCase() &&
        u.password === password
    )
    if (!user) return { success: false, error: 'Invalid admin credentials.' }
    ls_set('session', user)
    setCurrentUser(user)
    return { success: true, user }
  }, [])

  const logout = useCallback(() => {
    ls_set('session', null)
    setCurrentUser(null)
  }, [])

  const value = { currentUser, isLoading, loginCommittee, loginAdmin, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
