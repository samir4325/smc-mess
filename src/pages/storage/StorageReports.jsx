import React, { useState } from 'react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { ExportButton } from '../../components/shared/ExportButton'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { getStockStatus, stockStatusLabel } from '../../utils/stockCalculator'
import { STORAGE_STOCK_COLUMNS, STORAGE_GRN_COLUMNS } from '../../utils/exportUtils'
import { format } from 'date-fns'
import { BarChart3 } from 'lucide-react'

export function StorageReports() {
  const { getItems, getCategories, getGRNs } = useData()
  const [tab, setTab] = useState('stock')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatus] = useState('')
  const [fromDate, setFrom] = useState('')
  const [toDate, setTo]     = useState('')

  const categories = getCategories()
  const catMap     = Object.fromEntries(categories.map(c => [c.id, c.name]))

  // Stock report data
  const stockData = getItems().map(i => ({
    ...i,
    categoryName: catMap[i.categoryId] || '—',
    stockStatus:  stockStatusLabel(getStockStatus(i.currentStock, i.minStockLimit)),
  })).filter(i => {
    const mc = catFilter ? i.categoryId === catFilter : true
    const ms = statusFilter ? i.stockStatus.toLowerCase().includes(statusFilter) : true
    return mc && ms
  })

  // GRN report data
  const grnData = getGRNs().map(g => ({
    ...g,
    // itemName already in grn
  })).filter(g => {
    const gDate = new Date(g.receivedDate || g.createdAt)
    const mf = fromDate ? gDate >= new Date(fromDate) : true
    const mt = toDate   ? gDate <= new Date(toDate + 'T23:59:59') : true
    return mf && mt
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const stockColumns = [
    { header: 'Item Name',       accessor: 'name',          cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Category',        accessor: 'categoryName' },
    { header: 'Unit',            accessor: 'unit' },
    { header: 'Current Stock',   accessor: 'currentStock',  cell: r => <span className="font-semibold">{r.currentStock}</span> },
    { header: 'Min Stock Limit', accessor: 'minStockLimit' },
    { header: 'Status',          accessor: 'stockStatus',   cell: r => <StatusBadge status={getStockStatus(r.currentStock, r.minStockLimit)} /> },
    { header: 'Remarks',         accessor: 'remarks',       cell: r => <span className="text-xs text-gray-400">{r.remarks||'—'}</span> },
  ]

  const grnColumns = [
    { header: 'GRN ID',       accessor: 'id',           cell: r => <span className="font-mono text-xs">{r.id}</span> },
    { header: 'Purchase ID',  accessor: 'purchaseId',   cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId||'—'}</span> },
    { header: 'Request ID',   accessor: 'requestId',    cell: r => <span className="font-mono text-xs text-gray-500">{r.requestId||'—'}</span> },
    { header: 'Item',         accessor: 'itemName',     cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Ordered Qty',  accessor: 'orderedQty' },
    { header: 'Received Qty', accessor: 'receivedQty', cell: r => <span className="text-emerald-600 font-medium">{r.receivedQty}</span> },
    { header: 'Short Qty',    accessor: 'shortQty',    cell: r => r.shortQty > 0 ? <span className="text-red-500 font-medium">{r.shortQty}</span> : '—' },
    { header: 'Unit',         accessor: 'unit' },
    { header: 'Date',         accessor: 'receivedDate', cell: r => r.receivedDate ? format(new Date(r.receivedDate),'dd MMM yyyy') : '—' },
    { header: 'Condition',    accessor: 'condition' },
    { header: 'Remarks',      accessor: 'remarks',      cell: r => <span className="text-xs text-gray-400">{r.remarks||'—'}</span> },
  ]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[['stock','📦 Stock Report'],['grn','🚚 GRN Report']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700 font-medium">
        ⚠️ Storage reports do not include any financial information (prices, payments, bill amounts).
      </div>

      {tab === 'stock' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="form-select w-40">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="form-select w-36">
              <option value="">All Status</option>
              <option value="in stock">🟢 In Stock</option>
              <option value="low stock">🟡 Low Stock</option>
              <option value="out of stock">🔴 Out of Stock</option>
            </select>
            <ExportButton data={stockData} columns={STORAGE_STOCK_COLUMNS} filename="SMC_Stock_Report" title="SMC GEC Palanpur — Stock Report" />
          </div>
          <DataTable columns={stockColumns} data={stockData} />
        </>
      )}

      {tab === 'grn' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>From:</span><input type="date" value={fromDate} onChange={e => setFrom(e.target.value)} className="form-input w-36" />
              <span>To:</span><input type="date" value={toDate} onChange={e => setTo(e.target.value)} className="form-input w-36" />
            </div>
            <ExportButton data={grnData} columns={STORAGE_GRN_COLUMNS} filename="SMC_GRN_Report" title="SMC GEC Palanpur — GRN Report" />
          </div>
          <DataTable columns={grnColumns} data={grnData} />
        </>
      )}
    </div>
  )
}
