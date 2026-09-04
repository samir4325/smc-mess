import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, Search, PackageMinus } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { DataTable } from '../../components/shared/DataTable'
import { Modal } from '../../components/shared/Modal'

const schema = z.object({
  itemId:  z.string().min(1, 'Select an item'),
  qty:     z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  date:    z.string().min(1, 'Date required'),
  purpose: z.string().min(1, 'Purpose required'),
  issuedBy:z.string().min(1),
  remarks: z.string().optional(),
})

export function StockOutPage() {
  const { getItems, getCategories, getStockOuts, addStockOut } = useData()
  const { currentUser } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch]   = useState('')

  const items     = getItems().filter(i => i.isActive !== false)
  const catMap    = Object.fromEntries(getCategories().map(c => [c.id, c.name]))
  const itemsMap  = Object.fromEntries(items.map(i => [i.id, i]))

  const stockOuts = getStockOuts().map(so => ({
    ...so,
    itemName:     itemsMap[so.itemId]?.name || so.itemId,
    categoryName: catMap[itemsMap[so.itemId]?.categoryId] || '—',
    unit:         itemsMap[so.itemId]?.unit || '',
  })).filter(so =>
    so.itemName.toLowerCase().includes(search.toLowerCase()) ||
    (so.purpose || '').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd'), issuedBy: currentUser?.name || '' }
  })

  const selectedItemId   = watch('itemId')
  const selectedItem     = itemsMap[selectedItemId]
  const enteredQty       = Number(watch('qty') || 0)
  const exceeds          = selectedItem && enteredQty > selectedItem.currentStock

  const onSubmit = (data) => {
    try {
      addStockOut(data, currentUser)
      toast.success(`Stock out recorded: ${data.qty} ${selectedItem?.unit} of ${selectedItem?.name}`)
      setAddOpen(false)
      reset({ date: format(new Date(), 'yyyy-MM-dd'), issuedBy: currentUser?.name || '' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    { header: 'ID',       accessor: 'id',           cell: r => <span className="font-mono text-xs text-gray-500">{r.id}</span> },
    { header: 'Item',     accessor: 'itemName',      cell: r => <span className="font-medium">{r.itemName}</span> },
    { header: 'Category', accessor: 'categoryName' },
    { header: 'Qty Out',  accessor: 'qty',           cell: r => <span className="font-semibold text-red-600">-{r.qty} {r.unit}</span> },
    { header: 'Date',     accessor: 'date',          cell: r => r.date ? format(new Date(r.date), 'dd MMM yyyy') : '—' },
    { header: 'Purpose',  accessor: 'purpose' },
    { header: 'Issued By',accessor: 'issuedBy' },
    { header: 'Remarks',  accessor: 'remarks',       cell: r => <span className="text-xs text-gray-400">{r.remarks || '—'}</span> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search stock out records..." />
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-danger"><PackageMinus className="w-4 h-4" />New Stock Out</button>
      </div>

      <DataTable columns={columns} data={stockOuts} emptyMessage="No stock-out records yet." />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="New Stock Out" size="md"
        footer={<>
          <button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn-danger" onClick={handleSubmit(onSubmit)} disabled={exceeds}>Issue Stock</button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Item *</label>
            <select {...register('itemId')} className="form-select">
              <option value="">Select item</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock} {i.unit})</option>)}
            </select>
            {errors.itemId && <p className="form-error">{errors.itemId.message}</p>}
          </div>
          {selectedItem && (
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              Current Stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong>
            </div>
          )}
          <div>
            <label className="form-label">Quantity *</label>
            <input {...register('qty')} type="number" step="0.01" min="0" className={`form-input ${exceeds ? 'border-red-400 bg-red-50' : ''}`} />
            {exceeds && <p className="form-error">Cannot exceed available stock ({selectedItem?.currentStock} {selectedItem?.unit})</p>}
            {errors.qty && <p className="form-error">{errors.qty.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date *</label>
              <input {...register('date')} type="date" className="form-input" />
            </div>
            <div>
              <label className="form-label">Issued By</label>
              <input {...register('issuedBy')} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Purpose *</label>
            <input {...register('purpose')} className="form-input" placeholder="e.g. Kitchen — Lunch preparation" />
            {errors.purpose && <p className="form-error">{errors.purpose.message}</p>}
          </div>
          <div>
            <label className="form-label">Remarks</label>
            <input {...register('remarks')} className="form-input" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
