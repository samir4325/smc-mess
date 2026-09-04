import React, { useState } from 'react'
import { format } from 'date-fns'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { ExportButton } from '../../components/shared/ExportButton'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ACCOUNT_BILL_COLUMNS } from '../../utils/exportUtils'

const PAYMENT_EXPORT_COLUMNS = [
  { header: 'Payment ID', accessor: 'id' },
  { header: 'Bill ID', accessor: 'billId' },
  { header: 'Purchase ID', accessor: 'purchaseId' },
  { header: 'Vendor', accessor: 'vendorName' },
  { header: 'Amount (₹)', accessor: 'amount' },
  { header: 'Date', accessor: 'paymentDate' },
  { header: 'Payment Mode', accessor: 'paymentMode' },
  { header: 'Reference No.', accessor: 'referenceNumber' },
  { header: 'Remarks', accessor: 'remarks' },
]

export function AccountReports() {
  const { getBills, getPayments, getVendors, getPurchases } = useData()
  const [tab, setTab] = useState('bills')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const purchases = Object.fromEntries(getPurchases().map(p => [p.id, p]))
  const payments = getPayments()

  const billsData = getBills().map(b => {
    const bPays = payments.filter(p => p.billId === b.id)
    const paid = bPays.reduce((s, p) => s + Number(p.amount || 0), 0)
    const remaining = Math.max(0, Number(b.billAmount || 0) - paid)
    const payStatus = remaining <= 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'pending'
    return {
      ...b,
      vendorName: vendors[b.vendorId] || b.vendorId || '—',
      paidAmount: paid,
      remaining,
      paymentStatus: payStatus,
    }
  }).filter(b => {
    const bDate = new Date(b.billDate || b.createdAt)
    const mf = fromDate ? bDate >= new Date(fromDate) : true
    const mt = toDate ? bDate <= new Date(toDate + 'T23:59:59') : true
    return mf && mt
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const paymentsData = payments.map(p => ({
    ...p,
    vendorName: vendors[p.vendorId] || '—',
  })).filter(p => {
    const pDate = new Date(p.paymentDate || p.createdAt)
    const mf = fromDate ? pDate >= new Date(fromDate) : true
    const mt = toDate ? pDate <= new Date(toDate + 'T23:59:59') : true
    return mf && mt
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const billColumns = [
    { header: 'Bill ID', accessor: 'id', cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId', cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId}</span> },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Bill No.', accessor: 'billNumber' },
    { header: 'Bill Date', accessor: 'billDate' },
    { header: 'Bill Amount', accessor: 'billAmount', cell: r => `₹${Number(r.billAmount || 0).toLocaleString()}` },
    { header: 'Paid Amount', accessor: 'paidAmount', cell: r => <span className="text-emerald-700 font-semibold">₹{Number(r.paidAmount || 0).toLocaleString()}</span> },
    { header: 'Remaining', accessor: 'remaining', cell: r => <span className={r.remaining > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>₹{Number(r.remaining || 0).toLocaleString()}</span> },
    { header: 'Verification', accessor: 'verificationStatus', cell: r => <StatusBadge status={r.verificationStatus || 'pending_verification'} /> },
    { header: 'Payment', accessor: 'paymentStatus', cell: r => <StatusBadge status={r.paymentStatus} /> },
  ]

  const paymentColumns = [
    { header: 'Payment ID', accessor: 'id', cell: r => <span className="font-mono text-xs font-semibold text-emerald-700">{r.id}</span> },
    { header: 'Bill ID', accessor: 'billId', cell: r => <span className="font-mono text-xs text-gray-500">{r.billId}</span> },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Amount', accessor: 'amount', cell: r => <span className="font-bold text-emerald-700">₹{Number(r.amount || 0).toLocaleString()}</span> },
    { header: 'Date', accessor: 'paymentDate' },
    { header: 'Mode', accessor: 'paymentMode' },
    { header: 'Reference No.', accessor: 'referenceNumber', cell: r => <span className="font-mono text-xs">{r.referenceNumber || '—'}</span> },
    { header: 'Remarks', accessor: 'remarks', cell: r => <span className="text-xs text-gray-400">{r.remarks || '—'}</span> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex border-b border-gray-200">
        {[['bills', '🧾 Bills & Invoices Report'], ['payments', '💳 Payment Disbursements Report']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>From:</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-input w-36" />
          <span>To:</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-input w-36" />
        </div>

        {tab === 'bills' && (
          <ExportButton data={billsData} columns={ACCOUNT_BILL_COLUMNS} filename="SMC_Bills_Report" title="SMC GEC Palanpur — Bills Report" />
        )}
        {tab === 'payments' && (
          <ExportButton data={paymentsData} columns={PAYMENT_EXPORT_COLUMNS} filename="SMC_Payments_Report" title="SMC GEC Palanpur — Payments Report" />
        )}
      </div>

      {tab === 'bills' && (
        <DataTable columns={billColumns} data={billsData} emptyMessage="No bills match selected range." />
      )}

      {tab === 'payments' && (
        <DataTable columns={paymentColumns} data={paymentsData} emptyMessage="No payments match selected range." />
      )}
    </div>
  )
}
