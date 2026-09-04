import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ allowedRoles }) {
  const { currentUser, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to their own dashboard
    const home = { admin: '/admin', storage: '/storage', procurement: '/procurement', account: '/account' }
    return <Navigate to={home[currentUser.role] || '/login'} replace />
  }

  return <Outlet />
}
