import React, { useState } from 'react'
import { format } from 'date-fns'
import { Search, Info } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'

export function StockInPage() {
  const { getStockIns, getItems } = useData()
  const [search, setSearch] = useState('')
  const [fromDate, setFrom] = useState('')
  const [toDate, setTo]     = useState('')

  const itemsMap = Object.fromEntries(getItems().map(i => [i.id, i]))

  const records = getStockIns().map(si => ({
    ...si,
    itemName: itemsMap[si.itemId]?.name || si.itemId,
    unit:     itemsMap[si.itemId]?.unit || '',
    category: itemsMap[si.itemId]?.categoryId || '',
  })).filter(si => {
    const ms = si.itemName.toLowerCase().includes(search.toLowerCase()) || si.grnId?.toLowerCase().includes(search.toLowerCase())
    const siDate = new Date(si.date || si.createdAt)
    const mf = fromDate ? siDate >= new Date(fromDate) : true
    const mt = toDate   ? siDate <= new Date(toDate + 'T23:59:59') : true
    return ms && mf && mt
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const columns = [
    { header: 'ID',       accessor: 'id',       cell: r => <span className="font-mono text-xs text-gray-500">{r.id}</span> },
    { header: 'GRN ID',   accessor: 'grnId',    cell: r => <span className="font-mono text-xs text-blue-600">{r.grnId}</span> },
    { header: 'Item',     accessor: 'itemName', cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Qty In',   accessor: 'qty',      cell: r => <span className="font-semibold text-emerald-600">+{r.qty} {r.unit}</span> },
    { header: 'Date',     accessor: 'date',     cell: r => r.date ? format(new Date(r.date), 'dd MMM yyyy') : '—' },
    { header: 'Recorded', accessor: 'createdAt',cell: r => r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy HH:mm') : '—' },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">Stock In is automatically generated when a GRN is submitted. You cannot add stock directly.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search by item or GRN..." />
        </div>
        <input type="date" value={fromDate} onChange={e => setFrom(e.target.value)} className="form-input w-36" />
        <input type="date" value={toDate}   onChange={e => setTo(e.target.value)}   className="form-input w-36" />
      </div>
      <DataTable columns={columns} data={records} emptyMessage="No stock-in records yet. Submit GRNs to record stock receipts." />
    </div>
  )
}
