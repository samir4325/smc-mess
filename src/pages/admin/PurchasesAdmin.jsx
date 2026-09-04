import React, { useState } from 'react'
import { format } from 'date-fns'
import { Search, Eye } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

export function PurchasesAdmin() {
  const { getPurchases, getVendors, getItems, getCategories, getGRNs, getBills, getPayments } = useData()
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const itemsMap  = Object.fromEntries(getItems().map(i => [i.id, i]))
  const catMap  = Object.fromEntries(getCategories().map(c => [c.id, c.name]))

  const purchases = getPurchases().map(p => ({
    ...p,
    vendorName: vendors[p.vendorId] || p.vendorId || '—',
    itemName: itemsMap[p.itemId]?.name || p.itemName || '—',
    categoryName: catMap[itemsMap[p.itemId]?.categoryId] || '—',
  })).filter(p => {
    const matchS = p.id.toLowerCase().includes(search.toLowerCase()) || p.itemName.toLowerCase().includes(search.toLowerCase())
    const matchSt = statusFilter ? p.status === statusFilter : true
    return matchS && matchSt
  })

  const STATUSES = ['ordered','partially_received','fully_received','short_supply','completed','cancelled']

  const columns = [
    { header: 'Purchase ID', accessor: 'id',         cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Request ID',  accessor: 'requestId',   cell: r => <span className="font-mono text-xs text-gray-500">{r.requestId || '—'}</span> },
    { header: 'Item',        accessor: 'itemName',    cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Vendor',      accessor: 'vendorName' },
    { header: 'Qty',         accessor: 'orderedQty',  cell: r => `${r.orderedQty} ${r.unit}` },
    { header: 'Rate',        accessor: 'rate',        cell: r => r.rate ? `₹${Number(r.rate).toLocaleString()}` : '—' },
    { header: 'Total Amt',   accessor: 'totalAmount', cell: r => r.totalAmount ? `₹${Number(r.totalAmount).toLocaleString()}` : '—' },
    { header: 'Status',      accessor: 'status',      cell: r => <StatusBadge status={r.status} /> },
    { header: 'Payment',     accessor: 'paymentStatus', cell: r => r.paymentStatus ? <StatusBadge status={r.paymentStatus} /> : <StatusBadge status="pending" /> },
    { header: 'Actions', sortable: false, cell: r => <button onClick={() => setSelected(r)} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600"><Eye className="w-3.5 h-3.5" /></button> }
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search purchases..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-44">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={purchases} />
      {selected && (
        <Modal isOpen title="Purchase Details" onClose={() => setSelected(null)} size="lg"
          footer={<button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[['Purchase ID',selected.id],['Request ID',selected.requestId||'—'],['Item',selected.itemName],['Category',selected.categoryName],['Vendor',selected.vendorName],['Ordered Qty',`${selected.orderedQty} ${selected.unit}`],['Rate',`₹${Number(selected.rate||0).toLocaleString()}`],['Total Amount',`₹${Number(selected.totalAmount||0).toLocaleString()}`],['Purchase Date',selected.purchaseDate],['Expected Delivery',selected.expectedDelivery||'—'],['Status',selected.status],['Payment Status',selected.paymentStatus||'pending'],['Remarks',selected.remarks||'—']].map(([k,v])=>(
              <div key={k}><dt className="text-gray-500 font-medium">{k}</dt><dd className="text-gray-900 mt-0.5">{v}</dd></div>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  )
}
