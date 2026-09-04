import React, { useState } from 'react'
import { format } from 'date-fns'
import { Search, Eye, Download } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

export function BillsAdmin() {
  const { getBills, getVendors, getPurchases } = useData()
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const vendors   = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const purchases = Object.fromEntries(getPurchases().map(p => [p.id, p]))

  const bills = getBills().map(b => ({
    ...b,
    vendorName: vendors[b.vendorId] || b.vendorId || '—',
  })).filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    b.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.vendorName.toLowerCase().includes(search.toLowerCase())
  )

  const openFile = (fileData) => {
    if (!fileData) return
    const win = window.open()
    win.document.write(`<iframe src="${fileData}" style="width:100%;height:100vh;border:none;"></iframe>`)
  }

  const columns = [
    { header: 'Bill ID',     accessor: 'id',                 cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId',         cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId}</span> },
    { header: 'Vendor',      accessor: 'vendorName' },
    { header: 'Bill No.',    accessor: 'billNumber' },
    { header: 'Bill Date',   accessor: 'billDate' },
    { header: 'Amount',      accessor: 'billAmount',         cell: r => <span className="font-semibold">₹{Number(r.billAmount||0).toLocaleString()}</span> },
    { header: 'Verification',accessor: 'verificationStatus', cell: r => <StatusBadge status={r.verificationStatus || 'pending_verification'} /> },
    { header: 'Payment',     accessor: 'paymentStatus',      cell: r => <StatusBadge status={r.paymentStatus || 'pending'} /> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <div className="flex gap-2">
          <button onClick={() => setSelected(r)} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600"><Eye className="w-3.5 h-3.5" /></button>
          {r.fileData && <button onClick={() => openFile(r.fileData)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Download className="w-3.5 h-3.5" /></button>}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-5">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search bills..." />
      </div>
      <DataTable columns={columns} data={bills} />
      {selected && (
        <Modal isOpen title="Bill Details" onClose={() => setSelected(null)} size="md"
          footer={<><button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>{selected.fileData && <button className="btn-primary" onClick={() => openFile(selected.fileData)}><Download className="w-4 h-4" />View Bill</button>}</>}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[['Bill ID',selected.id],['Purchase ID',selected.purchaseId],['Vendor',selected.vendorName],['Bill Number',selected.billNumber],['Bill Date',selected.billDate],['Bill Amount',`₹${Number(selected.billAmount||0).toLocaleString()}`],['Paid Amount',`₹${Number(selected.paidAmount||0).toLocaleString()}`],['Remaining',`₹${Number(selected.remaining||0).toLocaleString()}`],['Verification',selected.verificationStatus],['Payment Status',selected.paymentStatus||'pending'],['Physical Submitted',selected.physicalBillSubmitted?'Yes':'No'],['Remarks',selected.remarks||'—']].map(([k,v])=>(
              <div key={k}><dt className="text-gray-500 font-medium">{k}</dt><dd className="text-gray-900 mt-0.5">{v}</dd></div>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  )
}
