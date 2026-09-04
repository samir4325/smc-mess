import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LogIn, Lock, User, Hash, Eye, EyeOff, GraduationCap, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const committeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  enrollmentNumber: z.string().min(3, 'Invalid enrollment number'),
})
const adminSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
})

export function LoginPage() {
  const { currentUser, loginCommittee, loginAdmin } = useAuth()
  const [tab, setTab] = useState('committee') // 'committee' | 'admin'
  const [showPwd, setShowPwd] = useState(false)

  const committeeForm = useForm({ resolver: zodResolver(committeeSchema) })
  const adminForm = useForm({ resolver: zodResolver(adminSchema) })

  // Already logged in → redirect
  if (currentUser) {
    const home = { admin: '/admin', storage: '/storage', procurement: '/procurement', account: '/account' }
    return <Navigate to={home[currentUser.role] || '/storage'} replace />
  }

  const onCommitteeSubmit = (values) => {
    const result = loginCommittee(values.name, values.enrollmentNumber)
    if (result.success) {
      toast.success(`Welcome, ${result.user.name}!`)
    } else {
      toast.error(result.error)
    }
  }

  const onAdminSubmit = (values) => {
    const result = loginAdmin(values.username, values.password)
    if (result.success) {
      toast.success(`Welcome, ${result.user.name}!`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 1px, transparent 0)', backgroundSize: '50px 50px' }} />

      <div className="relative w-full max-w-md">
        {/* Header card */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SMC Portal</h1>
          <p className="text-primary-200 text-sm mt-1">Students Mess Committee — GEC Palanpur</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('committee')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                tab === 'committee'
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Committee Login
            </button>
            <button
              onClick={() => setTab('admin')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                tab === 'admin'
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Login
            </button>
          </div>

          {/* Committee form */}
          {tab === 'committee' && (
            <form onSubmit={committeeForm.handleSubmit(onCommitteeSubmit)} className="p-8 space-y-5">
              <div>
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...committeeForm.register('name')}
                    className="form-input pl-9"
                    placeholder="e.g. Raj Patel"
                  />
                </div>
                {committeeForm.formState.errors.name && (
                  <p className="form-error">{committeeForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="form-label">Enrollment Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...committeeForm.register('enrollmentNumber')}
                    className="form-input pl-9 uppercase"
                    placeholder="e.g. 21CE001"
                  />
                </div>
                {committeeForm.formState.errors.enrollmentNumber && (
                  <p className="form-error">{committeeForm.formState.errors.enrollmentNumber.message}</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-3 mt-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-medium mb-1">Demo Credentials:</p>
                <p>Storage: <strong>Raj Patel</strong> / <strong>21CE001</strong></p>
                <p>Procurement: <strong>Priya Mehta</strong> / <strong>21ME001</strong></p>
                <p>Account: <strong>Karan Desai</strong> / <strong>21EC001</strong></p>
              </div>
            </form>
          )}

          {/* Admin form */}
          {tab === 'admin' && (
            <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="p-8 space-y-5">
              <div>
                <label className="form-label">Admin Username</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...adminForm.register('username')}
                    className="form-input pl-9"
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>
                {adminForm.formState.errors.username && (
                  <p className="form-error">{adminForm.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...adminForm.register('password')}
                    type={showPwd ? 'text' : 'password'}
                    className="form-input pl-9 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {adminForm.formState.errors.password && (
                  <p className="form-error">{adminForm.formState.errors.password.message}</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-3 mt-2">
                <LogIn className="w-4 h-4" />
                Admin Login
              </button>
              <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
                <p className="font-medium mb-1">Demo Admin:</p>
                <p>Username: <strong>admin</strong> | Password: <strong>admin123</strong></p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-primary-300/60 text-xs mt-6">
          Hostel Students Mess Committee · Government Engineering College Palanpur
        </p>
      </div>
    </div>
  )
}
