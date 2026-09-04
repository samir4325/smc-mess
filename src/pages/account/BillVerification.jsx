import React, { useState } from 'react'
import { format } from 'date-fns'
import { Eye, Check, X, AlertCircle, FileText, Download } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import toast from 'react-hot-toast'

export function BillVerification() {
  const { getBills, updateBill, getVendors, getPurchases, getGRNs } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()

  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)
  const [correctionModalBill, setCorrectionModalBill] = useState(null)
  const [correctionRemarks, setCorrectionRemarks] = useState('')
  const [rejectBill, setRejectBill] = useState(null)

  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const purchases = Object.fromEntries(getPurchases().map(p => [p.id, p]))
  const grns = getGRNs()

  const bills = getBills().map(b => {
    const p = purchases[b.purchaseId]
    const pGRNs = grns.filter(g => g.purchaseId === b.purchaseId)
    const totalReceived = pGRNs.reduce((s, g) => s + Number(g.receivedQty || 0), 0)
    return {
      ...b,
      vendorName: vendors[b.vendorId] || b.vendorId || '—',
      itemName: p?.itemName || '—',
      orderedQty: p ? `${p.orderedQty} ${p.unit}` : '—',
      receivedQty: p ? `${totalReceived} ${p.unit}` : '—',
      grnStatus: p ? (totalReceived >= Number(p.orderedQty) ? 'Fully Received' : totalReceived > 0 ? `Partially Received (${totalReceived}/${p.orderedQty})` : 'Pending Delivery') : '—',
    }
  }).filter(b => statusFilter ? (b.verificationStatus || 'pending_verification') === statusFilter : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const handleVerify = (bill) => {
    updateBill(bill.id, { verificationStatus: 'verified' }, currentUser, addNotification)
    addNotification('procurement', `Bill ${bill.id} for Purchase ${bill.purchaseId} has been VERIFIED by Account Committee.`, 'success', bill.id)
    toast.success(`Bill ${bill.id} marked as Verified!`)
    setSelectedBill(null)
  }

  const handleReject = () => {
    if (!rejectBill) return
    updateBill(rejectBill.id, { verificationStatus: 'rejected' }, currentUser, addNotification)
    addNotification('procurement', `Bill ${rejectBill.id} was REJECTED by Account Committee.`, 'error', rejectBill.id)
    toast.error(`Bill ${rejectBill.id} rejected.`)
    setRejectBill(null)
    setSelectedBill(null)
  }

  const handleRequestCorrection = () => {
    if (!correctionModalBill) return
    updateBill(correctionModalBill.id, {
      verificationStatus: 'correction_required',
      correctionRemarks,
    }, currentUser, addNotification)
    addNotification('procurement', `Bill ${correctionModalBill.id} requires correction: ${correctionRemarks}`, 'warning', correctionModalBill.id)
    toast('Correction requested from Procurement.', { icon: '⚠️' })
    setCorrectionModalBill(null)
    setCorrectionRemarks('')
    setSelectedBill(null)
  }

  const openFile = (fileData) => {
    if (!fileData) return
    const win = window.open()
    win.document.write(`<iframe src="${fileData}" style="width:100%;height:100vh;border:none;"></iframe>`)
  }

  const columns = [
    { header: 'Bill ID', accessor: 'id', cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId', cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId}</span> },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Bill No.', accessor: 'billNumber' },
    { header: 'Amount (₹)', accessor: 'billAmount', cell: r => <span className="font-semibold text-gray-900">₹{Number(r.billAmount || 0).toLocaleString()}</span> },
    { header: 'Physical Bill', accessor: 'physicalBillSubmitted', cell: r => <span className={`badge ${r.physicalBillSubmitted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.physicalBillSubmitted ? 'Submitted' : 'Pending'}</span> },
    { header: 'GRN Status', accessor: 'grnStatus', cell: r => <span className="text-xs font-medium text-gray-600">{r.grnStatus}</span> },
    { header: 'Verification', accessor: 'verificationStatus', cell: r => <StatusBadge status={r.verificationStatus || 'pending_verification'} /> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <div className="flex gap-1.5">
          <button onClick={() => setSelectedBill(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Review Bill"><Eye className="w-3.5 h-3.5" /></button>
          {r.fileData && <button onClick={() => openFile(r.fileData)} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="View Document"><FileText className="w-3.5 h-3.5" /></button>}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-52">
          <option value="">All Verification Statuses</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="correction_required">Correction Required</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable columns={columns} data={bills} emptyMessage="No bills awaiting verification." />

      {/* Bill Review Details Modal */}
      {selectedBill && (
        <Modal isOpen title={`Review Bill — ${selectedBill.id}`} onClose={() => setSelectedBill(null)} size="lg"
          footer={
            <div className="flex justify-between w-full">
              <button className="btn-secondary" onClick={() => setSelectedBill(null)}>Close</button>
              <div className="flex gap-2">
                {selectedBill.fileData && (
                  <button className="btn-secondary text-xs" onClick={() => openFile(selectedBill.fileData)}>
                    <Download className="w-3.5 h-3.5" /> View Uploaded Bill
                  </button>
                )}
                {selectedBill.verificationStatus !== 'verified' && (
                  <>
                    <button className="btn-warning text-xs" onClick={() => { setCorrectionModalBill(selectedBill); }}>
                      <AlertCircle className="w-3.5 h-3.5" /> Request Correction
                    </button>
                    <button className="btn-danger text-xs" onClick={() => setRejectBill(selectedBill)}>
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button className="btn-success text-xs" onClick={() => handleVerify(selectedBill)}>
                      <Check className="w-3.5 h-3.5" /> Verify Bill
                    </button>
                  </>
                )}
              </div>
            </div>
          }>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[['Bill ID', selectedBill.id], ['Purchase ID', selectedBill.purchaseId], ['Vendor', selectedBill.vendorName], ['Bill Number', selectedBill.billNumber], ['Bill Date', selectedBill.billDate], ['Bill Amount', `₹${Number(selectedBill.billAmount || 0).toLocaleString()}`], ['Physical Bill Submitted', selectedBill.physicalBillSubmitted ? 'Yes' : 'No'], ['Material Status', selectedBill.grnStatus], ['Verification Status', selectedBill.verificationStatus || 'pending_verification'], ['Remarks', selectedBill.remarks || '—']].map(([k, v]) => (
              <div key={k}><dt className="text-gray-500 font-medium text-xs">{k}</dt><dd className="text-gray-900 mt-0.5">{v}</dd></div>
            ))}
          </dl>
        </Modal>
      )}

      {/* Correction Modal */}
      {correctionModalBill && (
        <Modal isOpen title={`Request Correction for ${correctionModalBill.id}`} onClose={() => setCorrectionModalBill(null)} size="md"
          footer={<>
            <button className="btn-secondary" onClick={() => setCorrectionModalBill(null)}>Cancel</button>
            <button className="btn-warning" onClick={handleRequestCorrection} disabled={!correctionRemarks.trim()}>Submit Request</button>
          </>}>
          <div>
            <label className="form-label">Correction Details / Issues *</label>
            <textarea
              value={correctionRemarks}
              onChange={e => setCorrectionRemarks(e.target.value)}
              className="form-input"
              rows={4}
              placeholder="Specify the error (e.g. wrong amount, missing tax details, mismatch with physical receipt)..."
            />
          </div>
        </Modal>
      )}

      {/* Reject Confirmation */}
      <ConfirmDialog
        isOpen={!!rejectBill}
        onClose={() => setRejectBill(null)}
        onConfirm={handleReject}
        title="Reject Bill"
        message={`Are you sure you want to reject Bill ${rejectBill?.id} from ${rejectBill?.vendorName}?`}
        danger
        confirmLabel="Reject Bill"
      />
    </div>
  )
}
