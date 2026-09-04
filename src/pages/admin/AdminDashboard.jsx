import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Package, AlertTriangle, ShoppingCart, Receipt, CreditCard,
  TrendingDown, Warehouse, ClipboardList, CheckCircle, Clock, FileText
} from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { StatCard } from '../../components/shared/StatCard'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { getStockStatus, STOCK_STATUS } from '../../utils/stockCalculator'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9']

export function AdminDashboard() {
  const {
    getItems, getCategories, getPurchases, getBills,
    getPayments, getRequests, getShortSupplies, getAuditLogs, getGRNs
  } = useData()

  const items      = getItems()
  const categories = getCategories()
  const purchases  = getPurchases()
  const bills      = getBills()
  const payments   = getPayments()
  const requests   = getRequests()
  const shortSupplies = getShortSupplies()
  const auditLogs  = getAuditLogs()
  const grns       = getGRNs()

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  // Stock stats
  const inStock   = items.filter(i => getStockStatus(i.currentStock, i.minStockLimit) === STOCK_STATUS.IN_STOCK).length
  const lowStock  = items.filter(i => getStockStatus(i.currentStock, i.minStockLimit) === STOCK_STATUS.LOW_STOCK).length
  const outStock  = items.filter(i => getStockStatus(i.currentStock, i.minStockLimit) === STOCK_STATUS.OUT_OF_STOCK).length

  // Financial stats
  const totalBillAmt = bills.reduce((s, b) => s + Number(b.billAmount || 0), 0)
  const totalPaid    = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalPending = totalBillAmt - totalPaid
  const pendingReqs  = requests.filter(r => r.status === 'pending').length
  const openSS       = shortSupplies.filter(s => s.status === 'open').length

  // Bar chart: stock by category
  const stockByCategory = useMemo(() => {
    const map = {}
    items.forEach(item => {
      const catName = catMap[item.categoryId] || 'Other'
      map[catName] = (map[catName] || 0) + item.currentStock
    })
    return Object.entries(map).map(([name, stock]) => ({ name, stock }))
  }, [items, catMap])

  // Pie chart: payment status
  const payStatusData = useMemo(() => {
    const paid = bills.filter(b => b.paymentStatus === 'paid').length
    const partial = bills.filter(b => b.paymentStatus === 'partially_paid').length
    const pending = bills.filter(b => !b.paymentStatus || b.paymentStatus === 'pending').length
    return [
      { name: 'Paid', value: paid },
      { name: 'Partially Paid', value: partial },
      { name: 'Pending', value: pending },
    ].filter(d => d.value > 0)
  }, [bills])

  const recentLogs = auditLogs.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Total Items"         value={items.length}      icon={Package}       color="blue" />
        <StatCard title="Low Stock"           value={lowStock}          icon={AlertTriangle} color="amber" />
        <StatCard title="Out of Stock"        value={outStock}          icon={TrendingDown}  color="red" />
        <StatCard title="Pending Requests"    value={pendingReqs}       icon={ClipboardList} color="indigo" />
        <StatCard title="Active Orders"       value={purchases.filter(p => p.status === 'ordered').length} icon={ShoppingCart} color="purple" />
        <StatCard title="Total Bills"         value={bills.length}      icon={Receipt}       color="blue" />
        <StatCard title="Total Paid"          value={`₹${totalPaid.toLocaleString()}`}    icon={CreditCard} color="green" />
        <StatCard title="Total Pending"       value={`₹${totalPending.toLocaleString()}`} icon={Clock}     color="red" />
        <StatCard title="Short Supply Issues" value={openSS}            icon={AlertTriangle} color="amber" />
        <StatCard title="Total GRNs"          value={grns.length}       icon={Warehouse}     color="indigo" />
        <StatCard title="Total Purchases"     value={purchases.length}  icon={FileText}      color="gray" />
        <StatCard title="Total Bill Amount"   value={`₹${totalBillAmt.toLocaleString()}`} icon={Receipt} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock by Category</h3>
          {stockByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No stock data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Status Distribution</h3>
          {payStatusData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No bills yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={payStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {payStatusData.map((_, i) => <Cell key={i} fill={['#10b981','#f59e0b','#ef4444'][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr>
                {['Action','Entity','Record ID','User','Timestamp'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-400">No activity yet.</td></tr>
              ) : recentLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="table-td"><span className="badge bg-blue-100 text-blue-700">{log.action}</span></td>
                  <td className="table-td text-gray-600">{log.entity}</td>
                  <td className="table-td font-mono text-xs">{log.recordId}</td>
                  <td className="table-td">{log.userName}</td>
                  <td className="table-td text-xs text-gray-400">{log.timestamp ? format(new Date(log.timestamp), 'dd MMM yyyy HH:mm') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
