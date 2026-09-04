import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { format } from 'date-fns'

const schema = z.object({ name: z.string().min(2, 'Category name required') })

export function CategoryManagementAdmin() {
  const { getCategories, addCategory, updateCategory } = useData()
  const { currentUser } = useAuth()
  const [search, setSearch]   = useState('')
  const [editCat, setEditCat] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const cats = getCategories().filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const openAdd  = () => { reset({ name: '' }); setAddOpen(true) }
  const openEdit = (c) => { setEditCat(c); reset({ name: c.name }) }

  const onSubmit = (data) => {
    if (editCat) {
      updateCategory(editCat.id, { name: data.name }, currentUser)
      toast.success('Category updated!')
      setEditCat(null)
    } else {
      addCategory({ name: data.name }, currentUser)
      toast.success('Category added!')
      setAddOpen(false)
    }
    reset()
  }

  const toggleActive = (c) => {
    updateCategory(c.id, { isActive: !c.isActive }, currentUser)
    toast.success(c.isActive ? 'Category deactivated.' : 'Category activated.')
    setConfirm(null)
  }

  const columns = [
    { header: 'ID',      accessor: 'id',        cell: r => <span className="font-mono text-xs text-gray-500">{r.id}</span> },
    { header: 'Name',    accessor: 'name',       cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Status',  accessor: 'isActive',   cell: r => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { header: 'Created', accessor: 'createdAt',  cell: r => r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : '—' },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setConfirm(r)} className={`p-1.5 rounded text-xs ${r.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}>
            {r.isActive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const FormFields = () => (
    <div>
      <label className="form-label">Category Name *</label>
      <input {...register('name')} className="form-input" placeholder="e.g. Grains" />
      {errors.name && <p className="form-error">{errors.name.message}</p>}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search categories..." />
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add Category</button>
      </div>
      <DataTable columns={columns} data={cats} />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Category" size="sm"
        footer={<><button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Add</button></>}>
        <FormFields />
      </Modal>
      <Modal isOpen={!!editCat} onClose={() => setEditCat(null)} title="Edit Category" size="sm"
        footer={<><button className="btn-secondary" onClick={() => setEditCat(null)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}>
        <FormFields />
      </Modal>
      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => toggleActive(confirm)}
        title="Toggle Category" message={`${confirm?.isActive ? 'Deactivate' : 'Activate'} "${confirm?.name}"?`}
        danger={confirm?.isActive} confirmLabel={confirm?.isActive ? 'Deactivate' : 'Activate'} />
    </div>
  )
}
