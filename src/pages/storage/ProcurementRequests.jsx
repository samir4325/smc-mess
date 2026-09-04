import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, Search, ClipboardList } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

const PRIORITIES = ['Normal','Urgent','Critical']

const schema = z.object({
  itemId:      z.string().min(1, 'Select an item'),
  requiredQty: z.coerce.number().min(0.01, 'Quantity required'),
  priority:    z.enum(['Normal','Urgent','Critical']),
  reason:      z.string().min(3, 'Reason required'),
  remarks:     z.string().optional(),
  requestDate: z.string().min(1),
})

export function ProcurementRequests() {
  const { getRequests, addRequest, getItems, getCategories } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [addOpen, setAddOpen]   = useState(false)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')

  const items    = getItems().filter(i => i.isActive !== false)
  const catMap   = Object.fromEntries(getCategories().map(c => [c.id, c.name]))
  const itemsMap = Object.fromEntries(items.map(i => [i.id, i]))

  const STATUSES = ['pending','under_review','approved','ordered','partially_received','fully_received','short_supply','completed','rejected']

  const requests = getRequests().map(r => ({
    ...r,
    categoryName: catMap[itemsMap[r.itemId]?.categoryId] || '—',
  })).filter(r => {
    const ms = r.id.toLowerCase().includes(search.toLowerCase()) || (r.itemName||'').toLowerCase().includes(search.toLowerCase())
    const mst = statusFilter ? r.status === statusFilter : true
    return ms && mst
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'Normal', requestDate: format(new Date(), 'yyyy-MM-dd') }
  })

  const selectedItemId = watch('itemId')
  const selectedItem   = itemsMap[selectedItemId]

  const onSubmit = (data) => {
    const item = itemsMap[data.itemId]
    const payload = { ...data, itemName: item?.name, unit: item?.unit, categoryId: item?.categoryId }
    const req = addRequest(payload, currentUser, addNotification)
    toast.success(`Request ${req.id} submitted to Procurement!`)
    setAddOpen(false)
    reset({ priority: 'Normal', requestDate: format(new Date(), 'yyyy-MM-dd') })
  }

  const priorityColors = { Normal: 'bg-gray-100 text-gray-700', Urgent: 'bg-amber-100 text-amber-800', Critical: 'bg-red-100 text-red-800' }

  const columns = [
    { header: 'Request ID', accessor: 'id',          cell: r => <span className="font-mono text-xs font-semibold text-primary-700">{r.id}</span> },
    { header: 'Item',       accessor: 'itemName',    cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Category',   accessor: 'categoryName' },
    { header: 'Qty',        accessor: 'requiredQty', cell: r => `${r.requiredQty} ${r.unit}` },
    { header: 'Priority',   accessor: 'priority',   cell: r => <span className={`badge ${priorityColors[r.priority] || 'bg-gray-100 text-gray-700'}`}>{r.priority}</span> },
    { header: 'Reason',     accessor: 'reason',     cell: r => <span className="text-xs text-gray-600">{r.reason}</span> },
    { header: 'Status',     accessor: 'status',     cell: r => <StatusBadge status={r.status} /> },
    { header: 'Date',       accessor: 'requestDate', cell: r => r.requestDate ? format(new Date(r.requestDate), 'dd MMM yyyy') : '—' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search requests..." />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="form-select w-44">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />New Request</button>
      </div>

      <DataTable columns={columns} data={requests} emptyMessage="No procurement requests yet." />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="New Procurement Request" size="md"
        footer={<><button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Submit Request</button></>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Item *</label>
            <select {...register('itemId')} className="form-select">
              <option value="">Select item</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (Current: {i.currentStock} {i.unit})</option>)}
            </select>
            {errors.itemId && <p className="form-error">{errors.itemId.message}</p>}
          </div>
          {selectedItem && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              Current stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong> | Min limit: {selectedItem.minStockLimit} {selectedItem.unit}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Required Quantity *</label>
              <input {...register('requiredQty')} type="number" step="0.01" min="0" className="form-input" />
              {selectedItem && <p className="text-xs text-gray-400 mt-0.5">Unit: {selectedItem.unit}</p>}
              {errors.requiredQty && <p className="form-error">{errors.requiredQty.message}</p>}
            </div>
            <div>
              <label className="form-label">Priority *</label>
              <select {...register('priority')} className="form-select">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Reason *</label>
            <input {...register('reason')} className="form-input" placeholder="e.g. Stock below minimum, upcoming meal prep" />
            {errors.reason && <p className="form-error">{errors.reason.message}</p>}
          </div>
          <div>
            <label className="form-label">Request Date</label>
            <input {...register('requestDate')} type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">Remarks</label>
            <textarea {...register('remarks')} className="form-input" rows={2} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
