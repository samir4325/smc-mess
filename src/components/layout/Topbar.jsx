import React, { useState } from 'react'
import { Bell, Menu, LogOut, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { NotificationPanel } from './NotificationPanel'

export function Topbar({ onMenuClick, pageTitle }) {
  const { currentUser, logout } = useAuth()
  const { getUnreadCount } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const unread = getUnreadCount(currentUser?.role)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 lg:left-64 z-20 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="flex-1 text-base font-semibold text-gray-800 truncate">{pageTitle}</h1>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {/* User info */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {currentUser?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-gray-800 leading-none">{currentUser?.name}</p>
              <p className="text-[10px] text-gray-400 capitalize mt-0.5">{currentUser?.role}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}
