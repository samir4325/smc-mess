import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const PAGE_TITLES = {
  // Admin
  '/admin':               'Admin Dashboard',
  '/admin/users':         'User Management',
  '/admin/categories':    'Category Management',
  '/admin/items':         'Item Management',
  '/admin/vendors':       'Vendor Management',
  '/admin/purchases':     'Purchases',
  '/admin/bills':         'Bills',
  '/admin/payments':      'Payments',
  '/admin/grns':          'GRNs',
  '/admin/transactions':  'Transaction History',
  '/admin/audit':         'Audit Log',
  // Storage
  '/storage':             'Storage Dashboard',
  '/storage/items':       'Items & Stock',
  '/storage/categories':  'Categories',
  '/storage/stock-in':    'Stock In Records',
  '/storage/stock-out':   'Stock Out',
  '/storage/grn':         'GRN — Goods Received Note',
  '/storage/requests':    'Procurement Requests',
  '/storage/purchase-status': 'Purchase Status',
  '/storage/short-supply':'Short Supply & Issues',
  '/storage/reports':     'Storage Reports',
  // Procurement
  '/procurement':         'Procurement Dashboard',
  '/procurement/requests':'Storage Requests',
  '/procurement/purchases':'Purchases',
  '/procurement/vendors': 'Vendor Management',
  '/procurement/bills':   'Bill Management',
  '/procurement/short-supply': 'Short Supply',
  '/procurement/reports': 'Procurement Reports',
  // Account
  '/account':             'Account Dashboard',
  '/account/bills':       'Bill Verification',
  '/account/payments':    'Payment Management',
  '/account/vendors':     'Vendor Payments',
  '/account/grn':         'Material Received',
  '/account/reports':     'Account Reports',
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] || 'SMC Portal'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 pt-14">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
