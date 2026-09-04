import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { AlertTriangle, Plus, Paperclip } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

const ISSUE_TYPES = ['short_quantity','damaged_material','wrong_item','quality_issue','other']

const schema = z.object({
  purchaseId: z.string().min(1, 'Select a purchase'),
  itemId:     z.string().min(1, 'Select an item'),
  issueType:  z.enum(ISSUE_TYPES),
  shortQty:   z.coerce.number().min(0),
  remarks:    z.string().min(3, 'Remarks required'),
})

export function ShortSupplyStorage() {
  const { getShortSupplies, addManualIssue, getPurchases, getItems } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [reportOpen, setReportOpen] = useState(false)
  const [attachment, setAttachment] = useState(null)

  const purchases = getPurchases()
  const items     = getItems()
  const itemsMap  = Object.fromEntries(items.map(i => [i.id, i]))

  const shortSupplies = getShortSupplies().map(ss => ({
    ...ss,
    itemName: itemsMap[ss.itemId]?.name || ss.itemName || '—',
    unit:     itemsMap[ss.itemId]?.unit || '',
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const selectedPurId = watch('purchaseId')
  const selectedPur   = purchases.find(p => p.id === selectedPurId)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAttachment(ev.target.result)
    reader.readAsDataURL(file)
  }

  const onSubmit = (data) => {
    const item = itemsMap[data.itemId]
    const payload = {
      ...data,
      itemName: item?.name,
      unit: item?.unit,
      fileData: attachment,
      grnId: null,
    }
    const ss = addManualIssue(payload, currentUser, addNotification)
    toast.success(`Issue ${ss.id} reported to Procurement & Account.`)
    setReportOpen(false)
    setAttachment(null)
    reset()
  }

  const issueTypeLabel = (t) => t?.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())

  const columns = [
    { header: 'SS ID',       accessor: 'id',          cell: r => <span className="font-mono text-xs font-semibold text-orange-700">{r.id}</span> },
    { header: 'GRN ID',      accessor: 'grnId',       cell: r => <span className="font-mono text-xs text-gray-500">{r.grnId||'Manual'}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId',  cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId||'—'}</span> },
    { header: 'Item',        accessor: 'itemName',    cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Short Qty',   accessor: 'shortQty',    cell: r => <span className="font-semibold text-red-600">{r.shortQty} {r.unit}</span> },
    { header: 'Issue Type',  accessor: 'issueType',   cell: r => <span className="badge bg-orange-100 text-orange-700">{issueTypeLabel(r.issueType)}</span> },
    { header: 'Status',      accessor: 'status',      cell: r => <StatusBadge status={r.status} /> },
    { header: 'Date',        accessor: 'createdAt',   cell: r => r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : '—' },
    { header: 'Remarks',     accessor: 'remarks',     cell: r => <span className="text-xs text-gray-500">{r.remarks}</span> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{shortSupplies.length} short supply / delivery issue records</p>
        <button onClick={() => setReportOpen(true)} className="btn-warning">
          <AlertTriangle className="w-4 h-4" /> Report Issue
        </button>
      </div>

      <DataTable columns={columns} data={shortSupplies} emptyMessage="No short supply issues reported." />

      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Delivery Issue / Short Supply" size="md"
        footer={<><button className="btn-secondary" onClick={() => setReportOpen(false)}>Cancel</button><button className="btn-warning" onClick={handleSubmit(onSubmit)}>Submit Issue</button></>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Purchase Order *</label>
            <select {...register('purchaseId')} className="form-select">
              <option value="">Select purchase...</option>
              {purchases.map(p => <option key={p.id} value={p.id}>{p.id} — {p.itemName} ({p.orderedQty} {p.unit})</option>)}
            </select>
            {errors.purchaseId && <p className="form-error">{errors.purchaseId.message}</p>}
          </div>
          <div>
            <label className="form-label">Item *</label>
            <select {...register('itemId')} className="form-select">
              <option value="">Select item...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Issue Type *</label>
            <select {...register('issueType')} className="form-select">
              {ISSUE_TYPES.map(t => <option key={t} value={t}>{issueTypeLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Short / Affected Quantity</label>
            <input {...register('shortQty')} type="number" step="0.01" min="0" className="form-input" />
          </div>
          <div>
            <label className="form-label">Remarks / Details *</label>
            <textarea {...register('remarks')} className="form-input" rows={3} placeholder="Describe the issue in detail..." />
            {errors.remarks && <p className="form-error">{errors.remarks.message}</p>}
          </div>
          <div>
            <label className="form-label">Attachment (Optional)</label>
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-primary-400 transition-colors">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{attachment ? 'File attached ✓' : 'Click to attach photo or document'}</span>
              <input type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
