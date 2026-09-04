import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Eye, ShoppingCart, Check, X } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'

const purchaseSchema = z.object({
  vendorId:         z.string().min(1, 'Select a vendor'),
  orderedQty:       z.coerce.number().min(0.01),
  rate:             z.coerce.number().min(0, 'Rate required'),
  purchaseDate:     z.string().min(1),
  expectedDelivery: z.string().optional(),
  remarks:          z.string().optional(),
})

const priorityColors = { Normal: 'bg-gray-100 text-gray-700', Urgent: 'bg-amber-100 text-amber-800', Critical: 'bg-red-100 text-red-800' }

export function RequestList() {
  const { getRequests, updateRequest, addPurchase, getVendors, getItems, getCategories } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [statusFilter, setStatus] = useState('')
  const [viewReq, setViewReq]     = useState(null)
  const [purchaseReq, setPurchaseReq] = useState(null)
  const [confirmReject, setConfirmReject] = useState(null)

  const vendors    = getVendors().filter(v => v.isActive !== false)
  const itemsMap   = Object.fromEntries(getItems().map(i => [i.id, i]))
  const catMap     = Object.fromEntries(getCategories().map(c => [c.id, c.name]))

  const STATUSES = ['pending','under_review','approved','ordered','partially_received','fully_received','completed','rejected']

  const requests = getRequests().map(r => ({
    ...r,
    categoryName: catMap[itemsMap[r.itemId]?.categoryId] || '—',
  })).filter(r => statusFilter ? r.status === statusFilter : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { purchaseDate: format(new Date(), 'yyyy-MM-dd') }
  })

  const orderedQty = Number(watch('orderedQty') || 0)
  const rate       = Number(watch('rate') || 0)
  const totalAmount= orderedQty * rate

  const openPurchaseModal = (req) => {
    setPurchaseReq(req)
    reset({ orderedQty: req.requiredQty, purchaseDate: format(new Date(), 'yyyy-MM-dd') })
  }

  const onPurchaseSubmit = (data) => {
    if (!purchaseReq) return
    const item = itemsMap[purchaseReq.itemId]
    const payload = {
      requestId:  purchaseReq.id,
      itemId:     purchaseReq.itemId,
      itemName:   item?.name || purchaseReq.itemName,
      unit:       item?.unit || purchaseReq.unit,
      ...data,
      totalAmount: Number(data.orderedQty) * Number(data.rate),
    }
    try {
      const pur = addPurchase(payload, currentUser, addNotification)
      toast.success(`Purchase ${pur.id} created for ${payload.itemName}!`)
      setPurchaseReq(null)
      reset()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const approve = (req) => {
    updateRequest(req.id, { status: 'approved' }, currentUser)
    addNotification('storage', `Your request ${req.id} has been approved by Procurement.`, 'success', req.id)
    toast.success(`Request ${req.id} approved.`)
    setViewReq(null)
  }

  const reject = (req) => {
    updateRequest(req.id, { status: 'rejected' }, currentUser)
    addNotification('storage', `Your request ${req.id} was rejected by Procurement.`, 'error', req.id)
    toast('Request rejected.', { icon: '❌' })
    setConfirmReject(null)
    setViewReq(null)
  }

  const columns = [
    { header: 'Request ID', accessor: 'id',          cell: r => <span className="font-mono text-xs font-semibold text-primary-700">{r.id}</span> },
    { header: 'Item',       accessor: 'itemName',    cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Category',   accessor: 'categoryName' },
    { header: 'Qty',        accessor: 'requiredQty', cell: r => `${r.requiredQty} ${r.unit}` },
    { header: 'Priority',   accessor: 'priority',   cell: r => <span className={`badge ${priorityColors[r.priority]||'bg-gray-100 text-gray-700'}`}>{r.priority}</span> },
    { header: 'Status',     accessor: 'status',     cell: r => <StatusBadge status={r.status} /> },
    { header: 'Date',       accessor: 'requestDate', cell: r => r.requestDate ? format(new Date(r.requestDate),'dd MMM yyyy') : '—' },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <div className="flex gap-2">
          <button onClick={() => setViewReq(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View"><Eye className="w-3.5 h-3.5" /></button>
          {['pending','approved'].includes(r.status) && (
            <button onClick={() => openPurchaseModal(r)} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Create Purchase"><ShoppingCart className="w-3.5 h-3.5" /></button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="form-select w-44">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={requests} emptyMessage="No storage requests." />

      {/* View request modal */}
      {viewReq && (
        <Modal isOpen title={`Request — ${viewReq.id}`} onClose={() => setViewReq(null)} size="md"
          footer={
            <div className="flex gap-2 w-full justify-between">
              <button className="btn-secondary" onClick={() => setViewReq(null)}>Close</button>
              <div className="flex gap-2">
                {viewReq.status === 'pending' && <>
                  <button className="btn-success" onClick={() => approve(viewReq)}><Check className="w-4 h-4" />Approve</button>
                  <button className="btn-danger" onClick={() => setConfirmReject(viewReq)}><X className="w-4 h-4" />Reject</button>
                </>}
                {['pending','approved'].includes(viewReq.status) && (
                  <button className="btn-primary" onClick={() => { setViewReq(null); openPurchaseModal(viewReq) }}><ShoppingCart className="w-4 h-4" />Create Purchase</button>
                )}
              </div>
            </div>
          }>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[['Request ID',viewReq.id],['Item',viewReq.itemName],['Category',viewReq.categoryName||'—'],['Required Qty',`${viewReq.requiredQty} ${viewReq.unit}`],['Priority',viewReq.priority],['Status',viewReq.status],['Reason',viewReq.reason],['Requested By',viewReq.requestedBy||'—'],['Date',viewReq.requestDate],['Remarks',viewReq.remarks||'—']].map(([k,v])=>(
              <div key={k}><dt className="text-gray-500 font-medium">{k}</dt><dd className="text-gray-900 mt-0.5">{v}</dd></div>
            ))}
          </dl>
        </Modal>
      )}

      {/* Create purchase modal */}
      {purchaseReq && (
        <Modal isOpen title={`Create Purchase for ${purchaseReq.id}`} onClose={() => setPurchaseReq(null)} size="lg"
          footer={<><button className="btn-secondary" onClick={() => setPurchaseReq(null)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onPurchaseSubmit)}><ShoppingCart className="w-4 h-4" />Place Purchase</button></>}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-700">Request: {purchaseReq.id}</p>
              <p className="text-gray-500">Item: {purchaseReq.itemName} · Required: {purchaseReq.requiredQty} {purchaseReq.unit}</p>
            </div>
            <div>
              <label className="form-label">Vendor *</label>
              <select {...register('vendorId')} className="form-select">
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name} — {v.contactPerson}</option>)}
              </select>
              {errors.vendorId && <p className="form-error">{errors.vendorId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Ordered Quantity *</label>
                <input {...register('orderedQty')} type="number" step="0.01" className="form-input" />
              </div>
              <div>
                <label className="form-label">Rate per {purchaseReq.unit} (₹) *</label>
                <input {...register('rate')} type="number" step="0.01" className="form-input" />
              </div>
            </div>
            {totalAmount > 0 && (
              <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-700">
                Total Amount: <strong>₹{totalAmount.toLocaleString()}</strong>
              </div>
            )}
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

      <ConfirmDialog isOpen={!!confirmReject} onClose={() => setConfirmReject(null)} onConfirm={() => reject(confirmReject)}
        title="Reject Request" message={`Reject request ${confirmReject?.id} for ${confirmReject?.itemName}?`}
        danger confirmLabel="Reject" />
    </div>
  )
}
