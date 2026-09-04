import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserPlus, Search, Edit2, UserX, UserCheck } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  enrollmentNumber: z.string().optional(),
  committee: z.enum(['storage','procurement','account']),
  isActive: z.boolean().optional(),
})

const COMMITTEES = ['storage','procurement','account']

export function UserManagement() {
  const { getUsers, addUser, updateUser } = useData()
  const { currentUser } = useAuth()
  const [search, setSearch]     = useState('')
  const [editUser, setEditUser] = useState(null)
  const [addOpen, setAddOpen]   = useState(false)
  const [confirmToggle, setConfirmToggle] = useState(null)

  const users = getUsers().filter(u => u.role !== 'admin')

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.enrollmentNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { committee: 'storage', isActive: true }
  })

  const openAdd = () => { reset({ committee: 'storage', isActive: true }); setAddOpen(true) }
  const openEdit = (u) => {
    setEditUser(u)
    reset({ name: u.name, enrollmentNumber: u.enrollmentNumber || '', committee: u.committee, isActive: u.isActive })
  }

  const onSubmit = (data) => {
    const payload = { ...data, role: data.committee, enrollmentNumber: data.enrollmentNumber || null }
    if (editUser) {
      updateUser(editUser.id, payload, currentUser)
      toast.success('User updated!')
      setEditUser(null)
    } else {
      addUser(payload, currentUser)
      toast.success('User added!')
      setAddOpen(false)
    }
    reset()
  }

  const toggleActive = (u) => {
    updateUser(u.id, { isActive: !u.isActive }, currentUser)
    toast.success(u.isActive ? 'User deactivated.' : 'User activated.')
    setConfirmToggle(null)
  }

  const columns = [
    { header: 'ID',             accessor: 'id', cell: r => <span className="font-mono text-xs text-gray-500">{r.id}</span> },
    { header: 'Name',           accessor: 'name', cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Enrollment No.', accessor: 'enrollmentNumber' },
    { header: 'Committee',      accessor: 'committee', cell: r => <span className="capitalize">{r.committee}</span> },
    { header: 'Status',         accessor: 'isActive', cell: r => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setConfirmToggle(r)} className={`p-1.5 rounded text-sm ${r.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`} title={r.isActive ? 'Deactivate' : 'Activate'}>
            {r.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </button>
        </div>
      )
    }
  ]

  const FormBody = () => (
    <div className="space-y-4">
      <div>
        <label className="form-label">Full Name *</label>
        <input {...register('name')} className="form-input" placeholder="e.g. Raj Patel" />
        {errors.name && <p className="form-error">{errors.name.message}</p>}
      </div>
      <div>
        <label className="form-label">Enrollment Number</label>
        <input {...register('enrollmentNumber')} className="form-input uppercase" placeholder="e.g. 21CE001" />
      </div>
      <div>
        <label className="form-label">Committee *</label>
        <select {...register('committee')} className="form-select">
          {COMMITTEES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        {errors.committee && <p className="form-error">{errors.committee.message}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search by name or enrollment..." />
        </div>
        <button onClick={openAdd} className="btn-primary"><UserPlus className="w-4 h-4" />Add Member</button>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No committee members found." />

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Committee Member" size="sm"
        footer={<><button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Add Member</button></>}>
        <FormBody />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit Member" size="sm"
        footer={<><button className="btn-secondary" onClick={() => setEditUser(null)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Save Changes</button></>}>
        <FormBody />
      </Modal>

      {/* Confirm Toggle */}
      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => toggleActive(confirmToggle)}
        title={confirmToggle?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${confirmToggle?.isActive ? 'deactivate' : 'activate'} ${confirmToggle?.name}?`}
        danger={confirmToggle?.isActive}
        confirmLabel={confirmToggle?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  )
}
