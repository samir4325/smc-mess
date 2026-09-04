import React from 'react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'

export function GRNsAdmin() {
  const { getGRNs, getItems } = useData()
  const itemsMap = Object.fromEntries(getItems().map(i => [i.id, i]))

  const grns = getGRNs().map(g => ({
    ...g,
    itemName: itemsMap[g.itemId]?.name || g.itemName || '—',
    unit:     itemsMap[g.itemId]?.unit || g.unit || '—',
  }))

  const columns = [
    { header: 'GRN ID',      accessor: 'id',           cell: r => <span className="font-mono text-xs font-semibold text-blue-700">{r.id}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId',   cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId||'—'}</span> },
    { header: 'Request ID',  accessor: 'requestId',    cell: r => <span className="font-mono text-xs text-gray-500">{r.requestId||'—'}</span> },
    { header: 'Item',        accessor: 'itemName',     cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Ordered Qty', accessor: 'orderedQty',   cell: r => `${r.orderedQty} ${r.unit}` },
    { header: 'Received Qty',accessor: 'receivedQty',  cell: r => <span className="text-emerald-700 font-semibold">{r.receivedQty} {r.unit}</span> },
    { header: 'Short Qty',   accessor: 'shortQty',     cell: r => r.shortQty > 0 ? <span className="text-red-600 font-semibold">{r.shortQty} {r.unit}</span> : <span className="text-gray-400">—</span> },
    { header: 'Condition',   accessor: 'condition',    cell: r => <StatusBadge status={r.condition?.toLowerCase() === 'good' ? 'in_stock' : r.condition?.toLowerCase() === 'damaged' ? 'rejected' : 'low_stock'} className="capitalize" /> },
    { header: 'Date',        accessor: 'receivedDate' },
    { header: 'Created By',  accessor: 'createdBy' },
  ]

  return (
    <div className="space-y-5">
      <DataTable columns={columns} data={grns} emptyMessage="No GRNs recorded yet." />
    </div>
  )
}
