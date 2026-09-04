import React from 'react'
import { X, Bell, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { cn } from '../../utils/cn'

const TYPE_COLORS = {
  info:    'bg-blue-100 text-blue-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  error:   'bg-red-100 text-red-600',
}

export function NotificationPanel({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const { getNotifications, markRead, markAllRead } = useNotifications()
  const notifications = getNotifications(currentUser?.role)

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />}
      <div className={cn(
        'fixed top-0 right-0 h-full w-80 z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Notifications</h2>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => markAllRead(currentUser?.role)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Mark all read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Bell className="w-8 h-8 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                'px-5 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                !n.isRead && 'bg-blue-50/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', !n.isRead ? 'bg-blue-500' : 'bg-gray-200')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs leading-relaxed', !n.isRead ? 'text-gray-800 font-medium' : 'text-gray-600')}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <span className={cn('flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', TYPE_COLORS[n.type] || TYPE_COLORS.info)}>
                  {n.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
