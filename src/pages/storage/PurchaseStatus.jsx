import React from 'react'
import { format } from 'date-fns'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ShoppingCart, Info } from 'lucide-react'

export function PurchaseStatus() {
  const { getPurchases, getItems, getCategories, getVendors } = useData()

  const items    = Object.fromEntries(getItems().map(i => [i.id, i]))
  const catMap   = Object.fromEntries(getCategories().map(c => [c.id, c.name]))
  // Storage only sees vendor name, NOT bank/financial details
  const vendorMap= Object.fromEntries(getVendors().map(v => [v.id, v.name]))

  const purchases = getPurchases().map(p => ({
    ...p,
    itemName:     items[p.itemId]?.name     || p.itemName     || '—',
    categoryName: catMap[items[p.itemId]?.categoryId] || '—',
    vendorName:   vendorMap[p.vendorId]     || p.vendorId     || '—',
    unit:         items[p.itemId]?.unit     || p.unit         || '',
    // Financial info EXCLUDED intentionally
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const columns = [
    { header: 'Purchase ID',       accessor: 'id',              cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Request ID',        accessor: 'requestId',       cell: r => <span className="font-mono text-xs text-gray-500">{r.requestId||'—'}</span> },
    { header: 'Item',              accessor: 'itemName',        cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Category',          accessor: 'categoryName' },
    { header: 'Ordered Qty',       accessor: 'orderedQty',      cell: r => `${r.orderedQty} ${r.unit}` },
    { header: 'Received Qty',      accessor: 'totalReceived',   cell: r => r.totalReceived > 0 ? <span className="text-emerald-600 font-medium">{r.totalReceived} {r.unit}</span> : <span className="text-gray-400">—</span> },
    { header: 'Vendor',            accessor: 'vendorName' },
    { header: 'Status',            accessor: 'status',          cell: r => <StatusBadge status={r.status} /> },
    { header: 'Expected Delivery', accessor: 'expectedDelivery',cell: r => r.expectedDelivery ? format(new Date(r.expectedDelivery), 'dd MMM yyyy') : '—' },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">This page shows purchases placed by Procurement Committee. Stock is only updated when you submit a GRN after physical delivery.</p>
      </div>
      {purchases.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No purchases placed yet. Submit a procurement request first.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={purchases} />
      )}
    </div>
  )
}
