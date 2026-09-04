import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, Edit3 } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'
import { getStockStatus } from '../../utils/stockCalculator'

const UNITS = ['kg','gram','litre','ml','packet','box','piece','bag','bundle','dozen','can','bottle','roll']

const itemSchema = z.object({
  name:          z.string().min(1, 'Item name required'),
  categoryId:    z.string().min(1, 'Category required'),
  unit:          z.string().min(1),
  currentStock:  z.coerce.number().min(0),
  minStockLimit: z.coerce.number().min(0),
  remarks:       z.string().optional(),
})
const minSchema = z.object({ minStockLimit: z.coerce.number().min(0, 'Must be 0 or more') })

export function ItemList() {
  const { getItems, getCategories, addItem, updateItem, updateMinStock } = useData()
  const { currentUser } = useAuth()
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addOpen, setAddOpen]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [minEdit, setMinEdit]   = useState(null)

  const categories = getCategories().filter(c => c.isActive)
  const catMap     = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const items = getItems().map(i => ({
    ...i, categoryName: catMap[i.categoryId] || '—', stockStatus: getStockStatus(i.currentStock, i.minStockLimit)
  })).filter(i => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase())
    const mc = catFilter ? i.categoryId === catFilter : true
    const mst = statusFilter ? i.stockStatus === statusFilter : true
    return ms && mc && mst
  })

  const itemForm = useForm({ resolver: zodResolver(itemSchema), defaultValues: { unit: 'kg', currentStock: 0, minStockLimit: 0 } })
  const minForm  = useForm({ resolver: zodResolver(minSchema) })

  const openAdd  = () => { itemForm.reset({ unit: 'kg', currentStock: 0, minStockLimit: 0 }); setAddOpen(true) }
  const openEdit = (i) => { setEditItem(i); itemForm.reset({ name: i.name, categoryId: i.categoryId, unit: i.unit, currentStock: i.currentStock, minStockLimit: i.minStockLimit, remarks: i.remarks || '' }) }
  const openMin  = (i) => { setMinEdit(i); minForm.reset({ minStockLimit: i.minStockLimit }) }

  const onItemSubmit = (data) => {
    if (editItem) { updateItem(editItem.id, data, currentUser); toast.success('Item updated!'); setEditItem(null) }
    else           { addItem(data, currentUser); toast.success('Item added!'); setAddOpen(false) }
    itemForm.reset()
  }
  const onMinSubmit = (data) => {
    updateMinStock(minEdit.id, data.minStockLimit, currentUser)
    toast.success(`Min stock limit updated to ${data.minStockLimit} ${minEdit.unit}`)
    setMinEdit(null)
    minForm.reset()
  }

  const STATUSES = [
    { value: 'in_stock',    label: '🟢 In Stock' },
    { value: 'low_stock',   label: '🟡 Low Stock' },
    { value: 'out_of_stock',label: '🔴 Out of Stock' },
  ]

  const columns = [
    { header: 'Item Name',    accessor: 'name',         cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Category',     accessor: 'categoryName' },
    { header: 'Unit',         accessor: 'unit' },
    { header: 'Current Stock',accessor: 'currentStock',  cell: r => <span className="font-semibold text-gray-900">{r.currentStock}</span> },
    { header: 'Min Limit',    accessor: 'minStockLimit', cell: r => (
        <div className="flex items-center gap-1.5">
          <span>{r.minStockLimit}</span>
          <button onClick={() => openMin(r)} className="p-1 rounded hover:bg-amber-50 text-amber-600" title="Edit min stock"><Edit3 className="w-3 h-3" /></button>
        </div>
      )
    },
    { header: 'Status',       accessor: 'stockStatus',  cell: r => <StatusBadge status={r.stockStatus} /> },
    { header: 'Remarks',      accessor: 'remarks',      cell: r => <span className="text-xs text-gray-400">{r.remarks || '—'}</span> },
    {
      header: 'Actions', sortable: false,
      cell: r => <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
    }
  ]

  const FormBody = ({ form }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="form-label">Item Name *</label>
        <input {...form.register('name')} className="form-input" />
        {form.formState.errors.name && <p className="form-error">{form.formState.errors.name.message}</p>}
      </div>
      <div>
        <label className="form-label">Category *</label>
        <select {...form.register('categoryId')} className="form-select">
          <option value="">Select</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Unit *</label>
        <select {...form.register('unit')} className="form-select">
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Current Stock</label>
        <input {...form.register('currentStock')} type="number" min="0" className="form-input" />
      </div>
      <div>
        <label className="form-label">Min Stock Limit</label>
        <input {...form.register('minStockLimit')} type="number" min="0" className="form-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="form-label">Remarks</label>
        <input {...form.register('remarks')} className="form-input" />
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search items..." />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="form-select w-40">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-36">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add Item</button>
      </div>

      <DataTable columns={columns} data={items} />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Item" size="md"
        footer={<><button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" onClick={itemForm.handleSubmit(onItemSubmit)}>Add Item</button></>}>
        <FormBody form={itemForm} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Item" size="md"
        footer={<><button className="btn-secondary" onClick={() => setEditItem(null)}>Cancel</button><button className="btn-primary" onClick={itemForm.handleSubmit(onItemSubmit)}>Save</button></>}>
        <FormBody form={itemForm} />
      </Modal>
      <Modal isOpen={!!minEdit} onClose={() => setMinEdit(null)} title={`Edit Min Stock — ${minEdit?.name}`} size="sm"
        footer={<><button className="btn-secondary" onClick={() => setMinEdit(null)}>Cancel</button><button className="btn-warning" onClick={minForm.handleSubmit(onMinSubmit)}>Update</button></>}>
        <div>
          <label className="form-label">Minimum Stock Limit ({minEdit?.unit})</label>
          <input {...minForm.register('minStockLimit')} type="number" min="0" className="form-input" />
          {minForm.formState.errors.minStockLimit && <p className="form-error">{minForm.formState.errors.minStockLimit.message}</p>}
          <p className="text-xs text-gray-400 mt-2">Current stock: <strong>{minEdit?.currentStock} {minEdit?.unit}</strong></p>
        </div>
      </Modal>
    </div>
  )
}
