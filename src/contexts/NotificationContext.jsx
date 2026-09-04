import React, { createContext, useContext, useState, useCallback } from 'react'
import { ls_get, ls_set } from '../utils/storageHelpers'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [refresh, setRefresh] = useState(0)

  const getNotifications = useCallback((role) => {
    const all = ls_get('notifications') || []
    if (role === 'admin') return all
    return all.filter(n => n.targetRole === role || n.targetRole === 'all')
  }, [])

  const getUnreadCount = useCallback((role) => {
    return getNotifications(role).filter(n => !n.isRead).length
  }, [getNotifications])

  const addNotification = useCallback((targetRole, message, type = 'info', relatedId = null) => {
    const notifications = ls_get('notifications') || []
    const entry = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      targetRole,
      message,
      type,  // info | success | warning | error
      relatedId,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    notifications.unshift(entry)
    ls_set('notifications', notifications.slice(0, 1000))
    setRefresh(r => r + 1)
    return entry
  }, [])

  const markRead = useCallback((id) => {
    const notifications = ls_get('notifications') || []
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    ls_set('notifications', updated)
    setRefresh(r => r + 1)
  }, [])

  const markAllRead = useCallback((role) => {
    const notifications = ls_get('notifications') || []
    const updated = notifications.map(n =>
      (n.targetRole === role || n.targetRole === 'all') ? { ...n, isRead: true } : n
    )
    ls_set('notifications', updated)
    setRefresh(r => r + 1)
  }, [])

  const value = { getNotifications, getUnreadCount, addNotification, markRead, markAllRead, refresh }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
