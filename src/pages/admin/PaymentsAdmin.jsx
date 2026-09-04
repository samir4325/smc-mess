import React from 'react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatCard } from '../../components/shared/StatCard'
import { CreditCard } from 'lucide-react'

export function PaymentsAdmin() {
  const { getPayments, getVendors, getBills } = useData()
  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const bills   = Object.fromEntries(getBills().map(b => [b.id, b]))

  const payments = getPayments().map(p => ({
    ...p,
    vendorName: vendors[p.vendorId] || (bills[p.billId]?.vendorName) || '—',
  }))

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)

  const columns = [
    { header: 'Payment ID',  accessor: 'id',           cell: r => <span className="font-mono text-xs font-semibold text-emerald-700">{r.id}</span> },
    { header: 'Bill ID',     accessor: 'billId',        cell: r => <span className="font-mono text-xs text-gray-500">{r.billId}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId',    cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId}</span> },
    { header: 'Vendor',      accessor: 'vendorName' },
    { header: 'Amount',      accessor: 'amount',        cell: r => <span className="font-semibold text-emerald-700">₹{Number(r.amount||0).toLocaleString()}</span> },
    { header: 'Date',        accessor: 'paymentDate' },
    { header: 'Mode',        accessor: 'paymentMode' },
    { header: 'Reference',   accessor: 'referenceNumber', cell: r => <span className="font-mono text-xs">{r.referenceNumber || '—'}</span> },
    { header: 'Remarks',     accessor: 'remarks',       cell: r => <span className="text-gray-500 text-xs">{r.remarks || '—'}</span> },
  ]

  return (
    <div className="space-y-5">
      <StatCard title="Total Paid" value={`₹${totalPaid.toLocaleString()}`} icon={CreditCard} color="green" subtitle={`${payments.length} transactions`} />
      <DataTable columns={columns} data={payments} />
    </div>
  )
}
