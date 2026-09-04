import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, PackagePlus, PackageMinus, ClipboardList,
  ShoppingCart, Truck, Users, Building2, Receipt, CreditCard, BarChart3,
  Settings, AlertTriangle, FileText, ShieldCheck, Warehouse, Store,
  X, ChevronDown, Tag, BookOpen
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../utils/cn'

const ROLE_COLORS = {
  admin:       'from-slate-800 to-slate-900',
  storage:     'from-blue-800 to-blue-900',
  procurement: 'from-indigo-800 to-indigo-900',
  account:     'from-emerald-800 to-emerald-900',
}

const ROLE_LABELS = {
  admin:       'Super Admin',
  storage:     'Storage Committee',
  procurement: 'Procurement Committee',
  account:     'Account Committee',
}

// ─── Nav items per role ───────────────────────────────────────────────────────
const NAV = {
  admin: [
    { label: 'Dashboard',           icon: LayoutDashboard, to: '/admin' },
    { label: 'Users',               icon: Users,           to: '/admin/users' },
    { label: 'Categories',          icon: Tag,             to: '/admin/categories' },
    { label: 'Items',               icon: Package,         to: '/admin/items' },
    { label: 'Vendors',             icon: Store,           to: '/admin/vendors' },
    { label: 'Purchases',           icon: ShoppingCart,    to: '/admin/purchases' },
    { label: 'Bills',               icon: Receipt,         to: '/admin/bills' },
    { label: 'Payments',            icon: CreditCard,      to: '/admin/payments' },
    { label: 'GRNs',                icon: Truck,           to: '/admin/grns' },
    { label: 'Transaction History', icon: BookOpen,        to: '/admin/transactions' },
    { label: 'Audit Log',           icon: ShieldCheck,     to: '/admin/audit' },
  ],
  storage: [
    { label: 'Dashboard',           icon: LayoutDashboard, to: '/storage' },
    { label: 'Items & Stock',       icon: Package,         to: '/storage/items' },
    { label: 'Categories',          icon: Tag,             to: '/storage/categories' },
    { label: 'Stock In',            icon: PackagePlus,     to: '/storage/stock-in' },
    { label: 'Stock Out',           icon: PackageMinus,    to: '/storage/stock-out' },
    { label: 'GRN',                 icon: Truck,           to: '/storage/grn' },
    { label: 'Procurement Requests',icon: ClipboardList,   to: '/storage/requests' },
    { label: 'Purchase Status',     icon: ShoppingCart,    to: '/storage/purchase-status' },
    { label: 'Short Supply / Issues',icon: AlertTriangle,  to: '/storage/short-supply' },
    { label: 'Reports',             icon: BarChart3,       to: '/storage/reports' },
  ],
  procurement: [
    { label: 'Dashboard',           icon: LayoutDashboard, to: '/procurement' },
    { label: 'Storage Requests',    icon: ClipboardList,   to: '/procurement/requests' },
    { label: 'Purchases',           icon: ShoppingCart,    to: '/procurement/purchases' },
    { label: 'Vendors',             icon: Store,           to: '/procurement/vendors' },
    { label: 'Bills',               icon: Receipt,         to: '/procurement/bills' },
    { label: 'Short Supply',        icon: AlertTriangle,   to: '/procurement/short-supply' },
    { label: 'Reports',             icon: BarChart3,       to: '/procurement/reports' },
  ],
  account: [
    { label: 'Dashboard',           icon: LayoutDashboard, to: '/account' },
    { label: 'Bill Verification',   icon: ShieldCheck,     to: '/account/bills' },
    { label: 'Payments',            icon: CreditCard,      to: '/account/payments' },
    { label: 'Vendor Payments',     icon: Store,           to: '/account/vendors' },
    { label: 'Material Received',   icon: Warehouse,       to: '/account/grn' },
    { label: 'Reports',             icon: BarChart3,       to: '/account/reports' },
  ],
}

export function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const role = currentUser?.role || 'storage'
  const navItems = NAV[role] || []
  const gradient = ROLE_COLORS[role] || ROLE_COLORS.storage

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-300 shadow-2xl',
        `bg-gradient-to-b ${gradient}`,
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <p className="text-white font-bold text-base leading-tight">SMC</p>
            <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">GEC Palanpur</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
              {currentUser?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-white/50 text-xs truncate">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}` || item.to === '/admin'}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-white/30 text-[10px]">© 2024 SMC GEC Palanpur</p>
        </div>
      </aside>
    </>
  )
}
