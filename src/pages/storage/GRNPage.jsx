import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, Truck, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

const grnSchema = z.object({
  purchaseId:   z.string().min(1, 'Select a purchase'),
  receivedQty:  z.coerce.number().min(0, 'Received qty must be >= 0'),
  receivedDate: z.string().min(1, 'Received date required'),
  condition:    z.enum(['Good','Damaged','Mixed']),
  remarks:      z.string().optional(),
})

export function GRNPage() {
  const { getPurchases, getGRNs, addGRN, getItems, getVendors } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [tab, setTab]       = useState('create')
  const [addOpen, setAddOpen] = useState(false)

  const itemsMap  = Object.fromEntries(getItems().map(i => [i.id, i]))
  const vendorMap = Object.fromEntries(getVendors().map(v => [v.id, v.name]))

  const eligiblePurchases = getPurchases().filter(p => ['ordered','partially_received'].includes(p.status))

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(grnSchema),
    defaultValues: { receivedDate: format(new Date(), 'yyyy-MM-dd'), condition: 'Good' }
  })

  const selectedPurId = watch('purchaseId')
  const selectedPur   = eligiblePurchases.find(p => p.id === selectedPurId)
  const receivedQty   = Number(watch('receivedQty') || 0)
  const shortQty      = selectedPur ? Math.max(0, Number(selectedPur.orderedQty) - receivedQty) : 0
  const overQty       = selectedPur && receivedQty > Number(selectedPur.orderedQty)

  const grns = getGRNs().map(g => ({
    ...g,
    itemName: itemsMap[g.itemId]?.name || g.itemName || '—',
    unit:     itemsMap[g.itemId]?.unit || g.unit || '—',
    vendorName: vendorMap[g.vendorId] || '—',
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const onSubmit = (data) => {
    if (!selectedPur) return
    const payload = {
      ...data,
      requestId:  selectedPur.requestId,
      itemId:     selectedPur.itemId,
      itemName:   itemsMap[selectedPur.itemId]?.name || selectedPur.itemName,
      vendorId:   selectedPur.vendorId,
      unit:       itemsMap[selectedPur.itemId]?.unit || selectedPur.unit,
      orderedQty: Number(selectedPur.orderedQty),
    }
    try {
      const grn = addGRN(payload, currentUser, addNotification)
      toast.success(`GRN ${grn.id} created. Stock updated +${data.receivedQty}`)
      if (shortQty > 0) toast(`⚠️ Short supply of ${shortQty} ${payload.unit} auto-reported.`, { icon: '⚠️' })
      setAddOpen(false)
      reset({ receivedDate: format(new Date(), 'yyyy-MM-dd'), condition: 'Good' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    { header: 'GRN ID',      accessor: 'id',           cell: r => <span className="font-mono text-xs font-semibold text-blue-700">{r.id}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId',   cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId||'—'}</span> },
    { header: 'Item',        accessor: 'itemName',     cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Ordered',     accessor: 'orderedQty',   cell: r => `${r.orderedQty} ${r.unit}` },
    { header: 'Received',    accessor: 'receivedQty',  cell: r => <span className="font-semibold text-emerald-600">{r.receivedQty} {r.unit}</span> },
    { header: 'Short',       accessor: 'shortQty',     cell: r => r.shortQty > 0 ? <span className="font-semibold text-red-600">{r.shortQty} {r.unit}</span> : <span className="text-gray-400">—</span> },
    { header: 'Condition',   accessor: 'condition' },
    { header: 'Date',        accessor: 'receivedDate', cell: r => r.receivedDate ? format(new Date(r.receivedDate), 'dd MMM yyyy') : '—' },
    { header: 'Created By',  accessor: 'createdBy' },
  ]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[['create','Create GRN'],['list','GRN List']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'create' && (
        <div className="card p-6 max-w-2xl">
          <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Create Goods Received Note
          </h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">Select Purchase Order *</label>
              <select {...register('purchaseId')} className="form-select">
                <option value="">Select a purchase...</option>
                {eligiblePurchases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {itemsMap[p.itemId]?.name || p.itemName} ({p.orderedQty} {itemsMap[p.itemId]?.unit}) [{p.status}]
                  </option>
                ))}
              </select>
              {errors.purchaseId && <p className="form-error">{errors.purchaseId.message}</p>}
            </div>

            {selectedPur && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1 border border-gray-200">
                <p className="font-medium text-gray-700 mb-2">Purchase Details (Read Only)</p>
                <p><span className="text-gray-500">Item:</span> {itemsMap[selectedPur.itemId]?.name || selectedPur.itemName}</p>
                <p><span className="text-gray-500">Vendor:</span> {vendorMap[selectedPur.vendorId]}</p>
                <p><span className="text-gray-500">Ordered Qty:</span> <strong>{selectedPur.orderedQty} {itemsMap[selectedPur.itemId]?.unit}</strong></p>
                <p><span className="text-gray-500">Request ID:</span> {selectedPur.requestId || '—'}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Received Quantity *</label>
                <input {...register('receivedQty')} type="number" step="0.01" min="0" className={`form-input ${overQty ? 'border-amber-400' : ''}`} />
                {overQty && <p className="text-amber-600 text-xs mt-1">⚠️ Received qty exceeds ordered qty</p>}
                {errors.receivedQty && <p className="form-error">{errors.receivedQty.message}</p>}
              </div>
              <div>
                <label className="form-label">Received Date *</label>
                <input {...register('receivedDate')} type="date" className="form-input" />
              </div>
            </div>

            {selectedPur && shortQty > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold">Short Supply Detected</p>
                  <p>Short Quantity: <strong>{shortQty} {itemsMap[selectedPur.itemId]?.unit}</strong> — A short supply record will be automatically created.</p>
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Condition *</label>
              <select {...register('condition')} className="form-select">
                <option>Good</option>
                <option>Damaged</option>
                <option>Mixed</option>
              </select>
            </div>
            <div>
              <label className="form-label">Remarks</label>
              <textarea {...register('remarks')} className="form-input" rows={2} placeholder="Any additional notes about the delivery..." />
            </div>

            <button onClick={handleSubmit(onSubmit)} className="btn-primary">
              <ClipboardCheck className="w-4 h-4" /> Submit GRN
            </button>
          </div>
        </div>
      )}

      {tab === 'list' && <DataTable columns={columns} data={grns} emptyMessage="No GRNs submitted yet." />}
    </div>
  )
}
