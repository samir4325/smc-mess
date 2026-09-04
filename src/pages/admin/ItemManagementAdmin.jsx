import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2 } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'
import { getStockStatus } from '../../utils/stockCalculator'

const UNITS = ['kg','gram','litre','ml','packet','box','piece','bag','bundle','dozen','can','bottle','roll']

const schema = z.object({
  name:          z.string().min(1, 'Item name required'),
  categoryId:    z.string().min(1, 'Category required'),
  unit:          z.string().min(1, 'Unit required'),
  currentStock:  z.coerce.number().min(0),
  minStockLimit: z.coerce.number().min(0),
  remarks:       z.string().optional(),
})

export function ItemManagementAdmin() {
  const { getItems, getCategories, addItem, updateItem } = useData()
  const { currentUser } = useAuth()
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [addOpen, setAddOpen]   = useState(false)

  const categories = getCategories().filter(c => c.isActive)
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const items = getItems().filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter ? i.categoryId === catFilter : true
    return matchSearch && matchCat
  }).map(i => ({
    ...i,
    categoryName: catMap[i.categoryId] || '—',
    stockStatus: getStockStatus(i.currentStock, i.minStockLimit),
  }))

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const openAdd = () => { reset({ currentStock: 0, minStockLimit: 0, unit: 'kg' }); setAddOpen(true) }
  const openEdit = (i) => {
    setEditItem(i)
    reset({ name: i.name, categoryId: i.categoryId, unit: i.unit, currentStock: i.currentStock, minStockLimit: i.minStockLimit, remarks: i.remarks || '' })
  }

  const onSubmit = (data) => {
    if (editItem) {
      updateItem(editItem.id, data, currentUser)
      toast.success('Item updated!')
      setEditItem(null)
    } else {
      addItem(data, currentUser)
      toast.success('Item added!')
      setAddOpen(false)
    }
    reset()
  }

  const columns = [
    { header: 'ID',          accessor: 'id',           cell: r => <span className="font-mono text-xs text-gray-500">{r.id}</span> },
    { header: 'Item Name',   accessor: 'name',         cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Category',    accessor: 'categoryName' },
    { header: 'Unit',        accessor: 'unit' },
    { header: 'Stock',       accessor: 'currentStock',  cell: r => <span className="font-semibold">{r.currentStock}</span> },
    { header: 'Min Limit',   accessor: 'minStockLimit' },
    { header: 'Status',      accessor: 'stockStatus',   cell: r => <StatusBadge status={r.stockStatus} /> },
    { header: 'Remarks',     accessor: 'remarks',       cell: r => <span className="text-gray-500 text-xs">{r.remarks || '—'}</span> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
      )
    }
  ]

  const FormBody = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="form-label">Item Name *</label>
        <input {...register('name')} className="form-input" />
        {errors.name && <p className="form-error">{errors.name.message}</p>}
      </div>
      <div>
        <label className="form-label">Category *</label>
        <select {...register('categoryId')} className="form-select">
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="form-error">{errors.categoryId.message}</p>}
      </div>
      <div>
        <label className="form-label">Unit *</label>
        <select {...register('unit')} className="form-select">
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Current Stock</label>
        <input {...register('currentStock')} type="number" min="0" className="form-input" />
      </div>
      <div>
        <label className="form-label">Min Stock Limit</label>
        <input {...register('minStockLimit')} type="number" min="0" className="form-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="form-label">Remarks</label>
        <input {...register('remarks')} className="form-input" />
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
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add Item</button>
      </div>

      <DataTable columns={columns} data={items} />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Item" size="md"
        footer={<><button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Add Item</button></>}>
        <FormBody />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Item" size="md"
        footer={<><button className="btn-secondary" onClick={() => setEditItem(null)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}>
        <FormBody />
      </Modal>
    </div>
  )
}
