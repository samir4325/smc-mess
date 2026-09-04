import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { AlertTriangle, ShoppingCart, CheckCircle } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

const completeSchema = z.object({
  vendorId: z.string().min(1, 'Select vendor'),
  orderedQty: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  rate: z.coerce.number().min(0, 'Rate required'),
  purchaseDate: z.string().min(1),
  expectedDelivery: z.string().optional(),
  remarks: z.string().optional(),
})

export function ShortSupplyProcurement() {
  const { getShortSupplies, getPurchases, getVendors, addPurchase, updateShortSupply } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [selectedIssue, setSelectedIssue] = useState(null)

  const shortSupplies = getShortSupplies().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const purchases = Object.fromEntries(getPurchases().map(p => [p.id, p]))
  const vendors = getVendors().filter(v => v.isActive !== false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(completeSchema),
    defaultValues: { purchaseDate: format(new Date(), 'yyyy-MM-dd') }
  })

  const openCompleteModal = (issue) => {
    setSelectedIssue(issue)
    const origPur = purchases[issue.purchaseId]
    reset({
      vendorId: origPur?.vendorId || '',
      orderedQty: issue.shortQty,
      rate: origPur?.rate || 0,
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      remarks: `Short Supply follow-up for ${issue.id} (Original: ${issue.purchaseId})`
    })
  }

  const onCompleteSubmit = (data) => {
    if (!selectedIssue) return
    const origPur = purchases[selectedIssue.purchaseId]
    const payload = {
      requestId: selectedIssue.requestId || origPur?.requestId || null,
      itemId: selectedIssue.itemId || origPur?.itemId,
      itemName: selectedIssue.itemName || origPur?.itemName,
      unit: origPur?.unit || 'kg',
      ...data,
      totalAmount: Number(data.orderedQty) * Number(data.rate),
      remarks: `${data.remarks || ''} [Follow-up for ${selectedIssue.id}]`,
    }

    try {
      const newPur = addPurchase(payload, currentUser, addNotification)
      updateShortSupply(selectedIssue.id, {
        status: 'in_progress',
        resolvedByPurchaseId: newPur.id
      }, currentUser)

      toast.success(`New follow-up purchase ${newPur.id} created for ${data.orderedQty} qty!`)
      setSelectedIssue(null)
      reset()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    { header: 'SS ID', accessor: 'id', cell: r => <span className="font-mono text-xs font-semibold text-orange-700">{r.id}</span> },
    { header: 'GRN ID', accessor: 'grnId', cell: r => <span className="font-mono text-xs text-gray-500">{r.grnId || 'Manual'}</span> },
    { header: 'Original Pur ID', accessor: 'purchaseId', cell: r => <span className="font-mono text-xs text-indigo-600">{r.purchaseId || '—'}</span> },
    { header: 'Item', accessor: 'itemName', cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Short Qty', accessor: 'shortQty', cell: r => <span className="font-semibold text-red-600">{r.shortQty}</span> },
    { header: 'Issue Type', accessor: 'issueType', cell: r => <span className="badge bg-orange-100 text-orange-700 capitalize">{r.issueType?.replace(/_/g, ' ')}</span> },
    { header: 'Status', accessor: 'status', cell: r => <StatusBadge status={r.status} /> },
    { header: 'Created', accessor: 'createdAt', cell: r => r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : '—' },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        r.status === 'open' ? (
          <button onClick={() => openCompleteModal(r)} className="btn-primary text-xs py-1 px-2.5">
            <ShoppingCart className="w-3.5 h-3.5" /> Complete Short Supply
          </button>
        ) : r.resolvedByPurchaseId ? (
          <span className="text-xs text-gray-500 font-mono">Pur: {r.resolvedByPurchaseId}</span>
        ) : <span className="text-xs text-gray-400">—</span>
      )
    }
  ]

  return (
    <div className="space-y-5">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
        Review shortage & delivery issues reported by Storage Committee. Click <strong>"Complete Short Supply"</strong> to order the remaining quantity linked to the same request.
      </div>

      <DataTable columns={columns} data={shortSupplies} emptyMessage="No short supplies reported." />

      {selectedIssue && (
        <Modal isOpen title={`Complete Short Supply — ${selectedIssue.id}`} onClose={() => setSelectedIssue(null)} size="lg"
          footer={<>
            <button className="btn-secondary" onClick={() => setSelectedIssue(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onCompleteSubmit)}>Create Follow-up Purchase</button>
          </>}>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p>Item: <strong>{selectedIssue.itemName}</strong></p>
              <p>Short Quantity: <strong className="text-red-600">{selectedIssue.shortQty}</strong></p>
              <p>Original Purchase: <span className="font-mono">{selectedIssue.purchaseId}</span></p>
            </div>

            <div>
              <label className="form-label">Vendor *</label>
              <select {...register('vendorId')} className="form-select">
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.contactPerson})</option>)}
              </select>
              {errors.vendorId && <p className="form-error">{errors.vendorId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Ordered Qty (Remaining) *</label>
                <input {...register('orderedQty')} type="number" step="0.01" className="form-input" />
                {errors.orderedQty && <p className="form-error">{errors.orderedQty.message}</p>}
              </div>
              <div>
                <label className="form-label">Rate (₹) *</label>
                <input {...register('rate')} type="number" step="0.01" className="form-input" />
                {errors.rate && <p className="form-error">{errors.rate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Purchase Date *</label>
                <input {...register('purchaseDate')} type="date" className="form-input" />
              </div>
              <div>
                <label className="form-label">Expected Delivery Date</label>
                <input {...register('expectedDelivery')} type="date" className="form-input" />
              </div>
            </div>

            <div>
              <label className="form-label">Remarks</label>
              <input {...register('remarks')} className="form-input" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
