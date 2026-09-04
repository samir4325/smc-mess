import React, { useState } from 'react'
import { format } from 'date-fns'
import { Eye, Warehouse, AlertTriangle, CheckCircle } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

export function GRNView() {
  const { getPurchases, getGRNs, getVendors, getItems } = useData()
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState(null)

  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const itemsMap = Object.fromEntries(getItems().map(i => [i.id, i]))
  const grns = getGRNs()

  const purchaseRecords = getPurchases().map(p => {
    const pGRNs = grns.filter(g => g.purchaseId === p.id)
    const totalReceived = pGRNs.reduce((s, g) => s + Number(g.receivedQty || 0), 0)
    const ordered = Number(p.orderedQty || 0)
    const shortQty = Math.max(0, ordered - totalReceived)
    const materialStatus = totalReceived >= ordered ? 'fully_received' : totalReceived > 0 ? 'partially_received' : 'pending'

    return {
      ...p,
      vendorName: vendors[p.vendorId] || p.vendorId || '—',
      itemName: itemsMap[p.itemId]?.name || p.itemName || '—',
      totalReceived,
      shortQty,
      materialStatus,
      grnList: pGRNs,
    }
  }).filter(p => statusFilter ? p.materialStatus === statusFilter : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const columns = [
    { header: 'Purchase ID', accessor: 'id', cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Request ID', accessor: 'requestId', cell: r => <span className="font-mono text-xs text-gray-500">{r.requestId || '—'}</span> },
    { header: 'Item', accessor: 'itemName', cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Ordered Qty', accessor: 'orderedQty', cell: r => `${r.orderedQty} ${r.unit}` },
    { header: 'Received Qty', accessor: 'totalReceived', cell: r => <span className="font-semibold text-emerald-600">{r.totalReceived} {r.unit}</span> },
    {
      header: 'Short Qty', accessor: 'shortQty',
      cell: r => r.shortQty > 0 ? <span className="text-red-600 font-semibold">{r.shortQty} {r.unit}</span> : <span className="text-gray-400">—</span>
    },
    { header: 'Material Status', accessor: 'materialStatus', cell: r => <StatusBadge status={r.materialStatus} /> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <button onClick={() => setSelectedPurchase(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View GRN Receipts">
          <Eye className="w-3.5 h-3.5" />
        </button>
      )
    }
  ]

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        Account Committee can inspect physical material arrival notes (GRNs) before verifying bills and approving supplier payments.
      </div>

      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-48">
          <option value="">All Material Statuses</option>
          <option value="pending">Pending Delivery</option>
          <option value="partially_received">Partially Received</option>
          <option value="fully_received">Fully Received</option>
        </select>
      </div>

      <DataTable columns={columns} data={purchaseRecords} emptyMessage="No purchase orders found." />

      {/* GRN List Modal */}
      {selectedPurchase && (
        <Modal isOpen title={`Material Delivery Notes — ${selectedPurchase.id}`} onClose={() => setSelectedPurchase(null)} size="lg"
          footer={<button className="btn-secondary" onClick={() => setSelectedPurchase(null)}>Close</button>}>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm grid grid-cols-2 gap-2">
              <div><p className="text-xs text-gray-500">Item</p><p className="font-semibold">{selectedPurchase.itemName}</p></div>
              <div><p className="text-xs text-gray-500">Vendor</p><p className="font-medium">{selectedPurchase.vendorName}</p></div>
              <div><p className="text-xs text-gray-500">Ordered</p><p className="font-medium">{selectedPurchase.orderedQty} {selectedPurchase.unit}</p></div>
              <div><p className="text-xs text-gray-500">Total Received</p><p className="font-bold text-emerald-600">{selectedPurchase.totalReceived} {selectedPurchase.unit}</p></div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Physical Delivery Receipts (GRNs)</h4>
              {selectedPurchase.grnList.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No GRNs generated for this purchase yet.</p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {selectedPurchase.grnList.map(g => (
                    <div key={g.id} className="p-3 text-sm flex justify-between items-center bg-white hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">{g.id}</span>
                          <span className="badge bg-gray-100 text-gray-700 text-[10px]">{g.condition}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Received Date: {g.receivedDate ? format(new Date(g.receivedDate), 'dd MMM yyyy') : '—'} by {g.createdBy || 'Storage'}</p>
                        {g.remarks && <p className="text-xs text-gray-500 italic mt-0.5">{g.remarks}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">+{g.receivedQty} {selectedPurchase.unit}</p>
                        {g.shortQty > 0 && <p className="text-xs text-red-500 font-semibold">{g.shortQty} Short</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
