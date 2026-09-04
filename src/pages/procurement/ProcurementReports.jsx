import React, { useState } from 'react'
import { format } from 'date-fns'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { ExportButton } from '../../components/shared/ExportButton'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { PROCUREMENT_PURCHASE_COLUMNS } from '../../utils/exportUtils'

export function ProcurementReports() {
  const { getPurchases, getVendors, getCategories, getPayments, getBills } = useData()
  const [tab, setTab] = useState('purchases')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const catMap = Object.fromEntries(getCategories().map(c => [c.id, c.name]))
  const payments = getPayments()
  const bills = getBills()

  const purchasesData = getPurchases().map(p => ({
    ...p,
    vendorName: vendors[p.vendorId] || p.vendorId || '—',
    categoryName: catMap[p.categoryId] || '—',
  })).filter(p => {
    const pDate = new Date(p.purchaseDate || p.createdAt)
    const mf = fromDate ? pDate >= new Date(fromDate) : true
    const mt = toDate ? pDate <= new Date(toDate + 'T23:59:59') : true
    const ms = statusFilter ? p.status === statusFilter : true
    return mf && mt && ms
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Vendor summary aggregation
  const vendorSummary = getVendors().map(v => {
    const vPurchases = getPurchases().filter(p => p.vendorId === v.id)
    const vBills = bills.filter(b => b.vendorId === v.id)
    const totalPurchases = vPurchases.length
    const totalAmount = vPurchases.reduce((s, p) => s + Number(p.totalAmount || 0), 0)
    const totalPaid = payments.filter(pay => pay.vendorId === v.id || vBills.some(b => b.id === pay.billId)).reduce((s, pay) => s + Number(pay.amount || 0), 0)
    const totalPending = totalAmount - totalPaid
    return {
      id: v.id,
      name: v.name,
      contactPerson: v.contactPerson,
      totalPurchases,
      totalAmount,
      totalPaid,
      totalPending: Math.max(0, totalPending),
    }
  })

  const purchaseColumns = [
    { header: 'Purchase ID', accessor: 'id', cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Request ID', accessor: 'requestId', cell: r => <span className="font-mono text-xs text-gray-500">{r.requestId || '—'}</span> },
    { header: 'Item', accessor: 'itemName', cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Qty', accessor: 'orderedQty', cell: r => `${r.orderedQty} ${r.unit}` },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Rate (₹)', accessor: 'rate' },
    { header: 'Total (₹)', accessor: 'totalAmount', cell: r => <span className="font-semibold">₹{Number(r.totalAmount || 0).toLocaleString()}</span> },
    { header: 'Status', accessor: 'status', cell: r => <StatusBadge status={r.status} /> },
    { header: 'Payment', accessor: 'paymentStatus', cell: r => <StatusBadge status={r.paymentStatus || 'pending'} /> },
    { header: 'Date', accessor: 'purchaseDate', cell: r => r.purchaseDate ? format(new Date(r.purchaseDate), 'dd MMM yyyy') : '—' },
  ]

  const vendorColumns = [
    { header: 'Vendor ID', accessor: 'id', cell: r => <span className="font-mono text-xs">{r.id}</span> },
    { header: 'Vendor Name', accessor: 'name', cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Contact', accessor: 'contactPerson' },
    { header: 'Total Purchases', accessor: 'totalPurchases' },
    { header: 'Total Orders (₹)', accessor: 'totalAmount', cell: r => `₹${Number(r.totalAmount || 0).toLocaleString()}` },
    { header: 'Total Paid (₹)', accessor: 'totalPaid', cell: r => <span className="text-emerald-700 font-semibold">₹{Number(r.totalPaid || 0).toLocaleString()}</span> },
    { header: 'Total Pending (₹)', accessor: 'totalPending', cell: r => <span className="text-red-600 font-semibold">₹{Number(r.totalPending || 0).toLocaleString()}</span> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex border-b border-gray-200">
        {[['purchases', '🛒 Purchase Orders Report'], ['vendors', '🏪 Vendor Summary Report']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'purchases' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>From:</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-input w-36" />
              <span>To:</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-input w-36" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-40">
              <option value="">All Statuses</option>
              {['ordered', 'partially_received', 'fully_received', 'completed', 'cancelled'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <ExportButton data={purchasesData} columns={PROCUREMENT_PURCHASE_COLUMNS} filename="SMC_Purchases_Report" title="SMC GEC Palanpur — Procurement Report" />
          </div>
          <DataTable columns={purchaseColumns} data={purchasesData} emptyMessage="No purchases match criteria." />
        </>
      )}

      {tab === 'vendors' && (
        <DataTable columns={vendorColumns} data={vendorSummary} emptyMessage="No vendor summary available." />
      )}
    </div>
  )
}
