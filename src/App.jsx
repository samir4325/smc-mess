import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Auth
import { LoginPage } from './components/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

// Admin pages
import { AdminDashboard }      from './pages/admin/AdminDashboard'
import { UserManagement }      from './pages/admin/UserManagement'
import { CategoryManagementAdmin } from './pages/admin/CategoryManagementAdmin'
import { ItemManagementAdmin } from './pages/admin/ItemManagementAdmin'
import { VendorManagementAdmin } from './pages/admin/VendorManagementAdmin'
import { PurchasesAdmin }      from './pages/admin/PurchasesAdmin'
import { BillsAdmin }          from './pages/admin/BillsAdmin'
import { PaymentsAdmin }       from './pages/admin/PaymentsAdmin'
import { GRNsAdmin }           from './pages/admin/GRNsAdmin'
import { TransactionHistory }  from './pages/admin/TransactionHistory'
import { AuditLog }            from './pages/admin/AuditLog'

// Storage pages
import { StorageDashboard }    from './pages/storage/StorageDashboard'
import { ItemList }            from './pages/storage/ItemList'
import { StorageCategories }   from './pages/storage/StorageCategories'
import { StockInPage }         from './pages/storage/StockInPage'
import { StockOutPage }        from './pages/storage/StockOutPage'
import { GRNPage }             from './pages/storage/GRNPage'
import { ProcurementRequests } from './pages/storage/ProcurementRequests'
import { PurchaseStatus }      from './pages/storage/PurchaseStatus'
import { ShortSupplyStorage }  from './pages/storage/ShortSupplyStorage'
import { StorageReports }      from './pages/storage/StorageReports'

// Procurement pages
import { ProcurementDashboard } from './pages/procurement/ProcurementDashboard'
import { RequestList }          from './pages/procurement/RequestList'
import { PurchaseList }         from './pages/procurement/PurchaseList'
import { VendorManagement }     from './pages/procurement/VendorManagement'
import { BillManagement }       from './pages/procurement/BillManagement'
import { ShortSupplyProcurement } from './pages/procurement/ShortSupplyProcurement'
import { ProcurementReports }   from './pages/procurement/ProcurementReports'

// Account pages
import { AccountDashboard }    from './pages/account/AccountDashboard'
import { BillVerification }    from './pages/account/BillVerification'
import { PaymentManagement }   from './pages/account/PaymentManagement'
import { VendorPayments }      from './pages/account/VendorPayments'
import { GRNView }             from './pages/account/GRNView'
import { AccountReports }      from './pages/account/AccountReports'

function RootRedirect() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  const home = { admin: '/admin', storage: '/storage', procurement: '/procurement', account: '/account' }
  return <Navigate to={home[currentUser.role] || '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppShell />}>
          <Route path="/admin"                element={<AdminDashboard />} />
          <Route path="/admin/users"          element={<UserManagement />} />
          <Route path="/admin/categories"     element={<CategoryManagementAdmin />} />
          <Route path="/admin/items"          element={<ItemManagementAdmin />} />
          <Route path="/admin/vendors"        element={<VendorManagementAdmin />} />
          <Route path="/admin/purchases"      element={<PurchasesAdmin />} />
          <Route path="/admin/bills"          element={<BillsAdmin />} />
          <Route path="/admin/payments"       element={<PaymentsAdmin />} />
          <Route path="/admin/grns"           element={<GRNsAdmin />} />
          <Route path="/admin/transactions"   element={<TransactionHistory />} />
          <Route path="/admin/audit"          element={<AuditLog />} />
        </Route>
      </Route>

      {/* Storage */}
      <Route element={<ProtectedRoute allowedRoles={['storage']} />}>
        <Route element={<AppShell />}>
          <Route path="/storage"                  element={<StorageDashboard />} />
          <Route path="/storage/items"            element={<ItemList />} />
          <Route path="/storage/categories"       element={<StorageCategories />} />
          <Route path="/storage/stock-in"         element={<StockInPage />} />
          <Route path="/storage/stock-out"        element={<StockOutPage />} />
          <Route path="/storage/grn"              element={<GRNPage />} />
          <Route path="/storage/requests"         element={<ProcurementRequests />} />
          <Route path="/storage/purchase-status"  element={<PurchaseStatus />} />
          <Route path="/storage/short-supply"     element={<ShortSupplyStorage />} />
          <Route path="/storage/reports"          element={<StorageReports />} />
        </Route>
      </Route>

      {/* Procurement */}
      <Route element={<ProtectedRoute allowedRoles={['procurement']} />}>
        <Route element={<AppShell />}>
          <Route path="/procurement"                element={<ProcurementDashboard />} />
          <Route path="/procurement/requests"       element={<RequestList />} />
          <Route path="/procurement/purchases"      element={<PurchaseList />} />
          <Route path="/procurement/vendors"        element={<VendorManagement />} />
          <Route path="/procurement/bills"          element={<BillManagement />} />
          <Route path="/procurement/short-supply"   element={<ShortSupplyProcurement />} />
          <Route path="/procurement/reports"        element={<ProcurementReports />} />
        </Route>
      </Route>

      {/* Account */}
      <Route element={<ProtectedRoute allowedRoles={['account']} />}>
        <Route element={<AppShell />}>
          <Route path="/account"           element={<AccountDashboard />} />
          <Route path="/account/bills"     element={<BillVerification />} />
          <Route path="/account/payments"  element={<PaymentManagement />} />
          <Route path="/account/vendors"   element={<VendorPayments />} />
          <Route path="/account/grn"       element={<GRNView />} />
          <Route path="/account/reports"   element={<AccountReports />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
