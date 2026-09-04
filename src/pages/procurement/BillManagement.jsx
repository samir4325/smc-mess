import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Upload, Eye, Download, AlertTriangle } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

const schema = z.object({
  purchaseId:            z.string().min(1, 'Select purchase'),
  billNumber:            z.string().min(1, 'Bill number required'),
  billDate:              z.string().min(1),
  billAmount:            z.coerce.number().min(0.01),
  physicalBillSubmitted: z.boolean().optional(),
  submissionDate:        z.string().optional(),
  submittedBy:           z.string().optional(),
  remarks:               z.string().optional(),
})

export function BillManagement() {
  const { getBills, addBill, updateBill, getPurchases, getVendors } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [fileData, setFileData]     = useState(null)
  const [duplicateWarn, setDupWarn] = useState(false)

  const purchases = getPurchases()
  const vendorsMap= Object.fromEntries(getVendors().map(v => [v.id, v.name]))

  const bills = getBills().map(b => ({
    ...b,
    vendorName: vendorsMap[b.vendorId] || '—',
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const selectedPurId = watch('purchaseId')
  const billNumber    = watch('billNumber')
  const physical      = watch('physicalBillSubmitted')
  const selectedPur   = purchases.find(p => p.id === selectedPurId)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['application/pdf','image/jpeg','image/png','image/jpg'].includes(file.type)) {
      toast.error('Only PDF, JPG, JPEG, PNG allowed.'); return
    }
    const reader = new FileReader()
    reader.onload = ev => setFileData(ev.target.result)
    reader.readAsDataURL(file)
  }

  const checkDuplicate = () => {
    if (!selectedPur || !billNumber) return
    const existing = bills.find(b => b.vendorId === selectedPur.vendorId && b.billNumber === billNumber)
    setDupWarn(!!existing)
  }

  const onSubmit = (data) => {
    if (!selectedPur) return
    const payload = { ...data, vendorId: selectedPur.vendorId, fileData }
    const bill = addBill(payload, currentUser, addNotification)
    toast.success(`Bill ${bill.id} uploaded!`)
    setUploadOpen(false)
    setFileData(null)
    setDupWarn(false)
    reset()
  }

  const openFile = (data) => {
    if (!data) return
    const win = window.open()
    win.document.write(`<iframe src="${data}" style="width:100%;height:100vh;border:none;"></iframe>`)
  }

  const columns = [
    { header: 'Bill ID',     accessor: 'id',                 cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId',         cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId}</span> },
    { header: 'Vendor',      accessor: 'vendorName' },
    { header: 'Bill No.',    accessor: 'billNumber' },
    { header: 'Bill Date',   accessor: 'billDate' },
    { header: 'Amount',      accessor: 'billAmount',         cell: r => <span className="font-semibold">₹{Number(r.billAmount||0).toLocaleString()}</span> },
    { header: 'Physical',    accessor: 'physicalBillSubmitted', cell: r => <span className={`badge ${r.physicalBillSubmitted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.physicalBillSubmitted ? 'Submitted' : 'Pending'}</span> },
    { header: 'Verification',accessor: 'verificationStatus', cell: r => <StatusBadge status={r.verificationStatus || 'pending_verification'} /> },
    { header: 'Payment',     accessor: 'paymentStatus',      cell: r => <StatusBadge status={r.paymentStatus || 'pending'} /> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <div className="flex gap-1">
          {r.fileData && <button onClick={() => openFile(r.fileData)} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="View Bill"><Eye className="w-3.5 h-3.5" /></button>}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setUploadOpen(true)} className="btn-primary"><Upload className="w-4 h-4" />Upload Bill</button>
      </div>
      <DataTable columns={columns} data={bills} emptyMessage="No bills uploaded yet." />

      <Modal isOpen={uploadOpen} onClose={() => { setUploadOpen(false); setFileData(null); setDupWarn(false); reset() }} title="Upload Bill" size="lg"
        footer={<><button className="btn-secondary" onClick={() => { setUploadOpen(false); setFileData(null); reset() }}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}><Upload className="w-4 h-4" />Upload</button></>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Purchase Order *</label>
            <select {...register('purchaseId')} className="form-select">
              <option value="">Select purchase...</option>
              {purchases.map(p => <option key={p.id} value={p.id}>{p.id} — {p.itemName} · ₹{Number(p.totalAmount||0).toLocaleString()}</option>)}
            </select>
            {errors.purchaseId && <p className="form-error">{errors.purchaseId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Bill Number *</label>
              <input {...register('billNumber')} className="form-input" onBlur={checkDuplicate} />
              {errors.billNumber && <p className="form-error">{errors.billNumber.message}</p>}
              {duplicateWarn && <p className="text-amber-600 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Warning: Same bill number exists for this vendor!</p>}
            </div>
            <div>
              <label className="form-label">Bill Date *</label>
              <input {...register('billDate')} type="date" className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Bill Amount (₹) *</label>
            <input {...register('billAmount')} type="number" step="0.01" className="form-input" />
            {errors.billAmount && <p className="form-error">{errors.billAmount.message}</p>}
          </div>
          <div>
            <label className="form-label">Bill File (PDF / JPG / PNG)</label>
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">{fileData ? '✅ File attached' : 'Click to upload bill'}</p>
                <p className="text-xs text-gray-400">PDF, JPG, JPEG, PNG supported</p>
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input {...register('physicalBillSubmitted')} type="checkbox" id="physical" className="rounded" />
            <label htmlFor="physical" className="text-sm text-gray-700">Physical Bill Submitted</label>
          </div>
          {physical && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">Submission Date</label><input {...register('submissionDate')} type="date" className="form-input" /></div>
              <div><label className="form-label">Submitted By</label><input {...register('submittedBy')} className="form-input" defaultValue={currentUser?.name} /></div>
            </div>
          )}
          <div><label className="form-label">Remarks</label><input {...register('remarks')} className="form-input" /></div>
        </div>
      </Modal>
    </div>
  )
}
