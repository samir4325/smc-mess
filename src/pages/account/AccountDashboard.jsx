import React, { useMemo } from 'react'
import { format } from 'date-fns'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Receipt, CreditCard, Clock, CheckCircle, AlertTriangle, ShieldCheck, Warehouse, FileText } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { StatCard } from '../../components/shared/StatCard'
import { StatusBadge } from '../../components/shared/StatusBadge'

export function AccountDashboard() {
  const { getPurchases, getBills, getPayments, getVendors, getGRNs, getShortSupplies } = useData()

  const purchases = getPurchases()
  const bills = getBills()
  const payments = getPayments()
  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const grns = getGRNs()
  const shortSupplies = getShortSupplies()

  const totalPurchases = purchases.length
  const totalBills = bills.length
  const totalBillAmount = bills.reduce((s, b) => s + Number(b.billAmount || 0), 0)
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalPending = Math.max(0, totalBillAmount - totalPaid)

  const pendingVerification = bills.filter(b => !b.verificationStatus || b.verificationStatus === 'pending_verification').length
  const partiallyPaidCount = bills.filter(b => b.paymentStatus === 'partially_paid').length

  // Monthly expense chart data
  const monthlyExpenseData = useMemo(() => {
    const map = {}
    payments.forEach(pay => {
      const d = pay.paymentDate ? new Date(pay.paymentDate) : new Date(pay.createdAt)
      const mKey = format(d, 'MMM yyyy')
      map[mKey] = (map[mKey] || 0) + Number(pay.amount || 0)
    })
    return Object.entries(map).map(([month, amount]) => ({ month, amount }))
  }, [payments])

  // Vendor pending breakdown
  const vendorPendingList = useMemo(() => {
    return Object.entries(vendors).map(([vId, vName]) => {
      const vBills = bills.filter(b => b.vendorId === vId)
      const vBillTotal = vBills.reduce((s, b) => s + Number(b.billAmount || 0), 0)
      const vPaidTotal = payments.filter(p => p.vendorId === vId || vBills.some(b => b.id === p.billId)).reduce((s, p) => s + Number(p.amount || 0), 0)
      return {
        id: vId,
        name: vName,
        totalBilled: vBillTotal,
        totalPaid: vPaidTotal,
        totalPending: Math.max(0, vBillTotal - vPaidTotal),
      }
    }).filter(v => v.totalBilled > 0)
  }, [vendors, bills, payments])

  const recentPayments = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Purchases" value={totalPurchases} icon={FileText} color="blue" />
        <StatCard title="Total Bills" value={totalBills} icon={Receipt} color="purple" />
        <StatCard title="Total Bill Amount" value={`₹${totalBillAmount.toLocaleString()}`} icon={Receipt} color="indigo" />
        <StatCard title="Total Paid" value={`₹${totalPaid.toLocaleString()}`} icon={CreditCard} color="green" />
        <StatCard title="Total Pending" value={`₹${totalPending.toLocaleString()}`} icon={Clock} color="red" />
        <StatCard title="Awaiting Verification" value={pendingVerification} icon={ShieldCheck} color="amber" />
        <StatCard title="Partially Paid" value={partiallyPaidCount} icon={CreditCard} color="amber" />
        <StatCard title="Material GRNs" value={grns.length} icon={Warehouse} color="blue" />
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Expenses</h3>
          {monthlyExpenseData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No payments recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Vendor Pending Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead>
                <tr>
                  <th className="table-th">Vendor</th>
                  <th className="table-th text-right">Billed</th>
                  <th className="table-th text-right">Paid</th>
                  <th className="table-th text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendorPendingList.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-400">No billed vendors.</td></tr>
                ) : (
                  vendorPendingList.map(v => (
                    <tr key={v.id}>
                      <td className="table-td font-medium">{v.name}</td>
                      <td className="table-td text-right">₹{v.totalBilled.toLocaleString()}</td>
                      <td className="table-td text-right text-emerald-600 font-medium">₹{v.totalPaid.toLocaleString()}</td>
                      <td className="table-td text-right text-red-600 font-bold">₹{v.totalPending.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr>
                <th className="table-th">Payment ID</th>
                <th className="table-th">Bill ID</th>
                <th className="table-th">Vendor</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Mode</th>
                <th className="table-th">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentPayments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400">No transactions recorded yet.</td></tr>
              ) : (
                recentPayments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-emerald-700 font-semibold">{p.id}</td>
                    <td className="table-td font-mono text-xs text-gray-500">{p.billId}</td>
                    <td className="table-td">{vendors[p.vendorId] || '—'}</td>
                    <td className="table-td font-semibold text-emerald-700">₹{Number(p.amount || 0).toLocaleString()}</td>
                    <td className="table-td">{p.paymentMode}</td>
                    <td className="table-td text-xs text-gray-400">{p.paymentDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
