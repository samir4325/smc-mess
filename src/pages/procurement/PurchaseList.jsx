import React, { useState } from 'react'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

export function PurchaseList() {
  const { getPurchases, getGRNs, getBills, getPayments, getVendors, getItems, getCategories } = useData()
  const [statusFilter, setStatus] = useState('')
  const [selected, setSelected]   = useState(null)

  const vendors  = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const itemsMap = Object.fromEntries(getItems().map(i => [i.id, i]))
  const catMap   = Object.fromEntries(getCategories().map(c => [c.id, c.name]))
  const grns     = getGRNs()
  const bills    = getBills()
  const payments = getPayments()

  const STATUSES = ['ordered','partially_received','fully_received','short_supply','completed','cancelled']

  const purchases = getPurchases().map(p => ({
    ...p,
    vendorName:   vendors[p.vendorId]       || '—',
    itemName:     itemsMap[p.itemId]?.name  || p.itemName || '—',
    categoryName: catMap[itemsMap[p.itemId]?.categoryId] || '—',
    unit:         itemsMap[p.itemId]?.unit  || p.unit || '',
  })).filter(p => statusFilter ? p.status === statusFilter : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const getDetail = (p) => ({
    linkedGRNs:    grns.filter(g => g.purchaseId === p.id),
    linkedBill:    bills.find(b => b.purchaseId === p.id),
    linkedPayments:payments.filter(pay => pay.purchaseId === p.id),
  })

  const columns = [
    { header: 'Purchase ID',  accessor: 'id',              cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Request ID',   accessor: 'requestId',       cell: r => <span className="font-mono text-xs text-gray-500">{r.requestId||'—'}</span> },
    { header: 'Item',         accessor: 'itemName',        cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Qty',          accessor: 'orderedQty',      cell: r => `${r.orderedQty} ${r.unit}` },
    { header: 'Vendor',       accessor: 'vendorName' },
    { header: 'Rate',         accessor: 'rate',            cell: r => r.rate ? `₹${Number(r.rate).toLocaleString()}` : '—' },
    { header: 'Total Amt',    accessor: 'totalAmount',     cell: r => r.totalAmount ? <span className="font-semibold">₹{Number(r.totalAmount).toLocaleString()}</span> : '—' },
    { header: 'Status',       accessor: 'status',          cell: r => <StatusBadge status={r.status} /> },
    { header: 'Payment',      accessor: 'paymentStatus',   cell: r => <StatusBadge status={r.paymentStatus || 'pending'} /> },
    { header: 'Exp. Delivery',accessor: 'expectedDelivery',cell: r => r.expectedDelivery ? format(new Date(r.expectedDelivery),'dd MMM') : '—' },
    { header: 'Actions', sortable: false, cell: r => <button onClick={() => setSelected(r)} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600"><Eye className="w-3.5 h-3.5" /></button> }
  ]

  return (
    <div className="space-y-5">
      <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="form-select w-44">
        <option value="">All Statuses</option>
        {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
      </select>
      <DataTable columns={columns} data={purchases} />

      {selected && (() => {
        const { linkedGRNs, linkedBill, linkedPayments } = getDetail(selected)
        return (
          <Modal isOpen title={`Purchase Details — ${selected.id}`} onClose={() => setSelected(null)} size="xl"
            footer={<button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>}>
            <div className="space-y-5">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                {[['Purchase ID',selected.id],['Request ID',selected.requestId||'—'],['Item',selected.itemName],['Category',selected.categoryName],['Vendor',selected.vendorName],['Ordered Qty',`${selected.orderedQty} ${selected.unit}`],['Rate',`₹${Number(selected.rate||0).toLocaleString()}`],['Total Amount',`₹${Number(selected.totalAmount||0).toLocaleString()}`],['Purchase Date',selected.purchaseDate],['Expected Delivery',selected.expectedDelivery||'—'],['Status',selected.status],['Payment Status',selected.paymentStatus||'pending']].map(([k,v])=>(
                  <div key={k}><dt className="text-gray-500 font-medium text-xs">{k}</dt><dd className="text-gray-900 text-sm mt-0.5">{v}</dd></div>
                ))}
              </dl>
              {linkedGRNs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Linked GRNs</p>
                  <div className="divide-y divide-gray-50">
                    {linkedGRNs.map(g => (
                      <div key={g.id} className="py-1.5 flex justify-between text-sm">
                        <span className="font-mono text-xs text-blue-600">{g.id}</span>
                        <span>Ordered: {g.orderedQty} | Received: <strong className="text-emerald-600">{g.receivedQty}</strong> | Short: <strong className="text-red-500">{g.shortQty}</strong></span>
                        <span className="text-xs text-gray-400">{g.receivedDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {linkedBill && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Linked Bill</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
                    <span className="font-mono text-indigo-600">{linkedBill.id}</span>
                    <span>₹{Number(linkedBill.billAmount||0).toLocaleString()}</span>
                    <StatusBadge status={linkedBill.verificationStatus || 'pending_verification'} />
                    <StatusBadge status={linkedBill.paymentStatus || 'pending'} />
                  </div>
                </div>
              )}
              {linkedPayments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payments</p>
                  <div className="divide-y divide-gray-50">
                    {linkedPayments.map(pay => (
                      <div key={pay.id} className="py-1.5 flex justify-between text-sm">
                        <span className="font-mono text-xs text-emerald-600">{pay.id}</span>
                        <span className="font-semibold text-emerald-700">₹{Number(pay.amount||0).toLocaleString()}</span>
                        <span className="text-xs text-gray-400">{pay.paymentDate} · {pay.paymentMode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}
