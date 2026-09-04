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

const schema = z.object({
  name:            z.string().min(2, 'Vendor name required'),
  contactPerson:   z.string().min(1),
  mobile:          z.string().min(10),
  alternateMobile: z.string().optional(),
  address:         z.string().min(5),
  email:           z.string().email().or(z.literal('')).optional(),
  bankName:        z.string().optional(),
  accountNumber:   z.string().optional(),
  ifsc:            z.string().optional(),
  remarks:         z.string().optional(),
})

export function VendorManagement() {
  const { getVendors, addVendor, updateVendor } = useData()
  const { currentUser } = useAuth()
  const [search, setSearch]       = useState('')
  const [editVendor, setEditVendor] = useState(null)
  const [addOpen, setAddOpen]     = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const vendors = getVendors().filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
    v.mobile?.includes(search)
  )

  const openAdd  = () => { reset({}); setAddOpen(true) }
  const openEdit = (v) => { setEditVendor(v); reset(v) }

  const onSubmit = (data) => {
    if (editVendor) { updateVendor(editVendor.id, data, currentUser); toast.success('Vendor updated!'); setEditVendor(null) }
    else            { addVendor(data, currentUser); toast.success('Vendor added!'); setAddOpen(false) }
    reset()
  }

  const columns = [
    { header: 'ID',             accessor: 'id',            cell: r => <span className="font-mono text-xs text-gray-500">{r.id}</span> },
    { header: 'Shop/Vendor',    accessor: 'name',          cell: r => <span className="font-medium">{r.name}</span> },
    { header: 'Contact Person', accessor: 'contactPerson' },
    { header: 'Mobile',         accessor: 'mobile' },
    { header: 'Address',        accessor: 'address',       cell: r => <span className="text-xs text-gray-500 max-w-32 truncate block">{r.address}</span> },
    { header: 'Bank Name',      accessor: 'bankName' },
    { header: 'Account No.',    accessor: 'accountNumber', cell: r => <span className="font-mono text-xs">{r.accountNumber||'—'}</span> },
    { header: 'IFSC',           accessor: 'ifsc',          cell: r => <span className="font-mono text-xs">{r.ifsc||'—'}</span> },
    { header: 'Status',         accessor: 'isActive',      cell: r => <StatusBadge status={r.isActive!==false ? 'active' : 'inactive'} /> },
    { header: 'Actions', sortable: false, cell: r => <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button> }
  ]

  const FormBody = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><label className="form-label">Shop/Vendor Name *</label><input {...register('name')} className="form-input" />{errors.name && <p className="form-error">{errors.name.message}</p>}</div>
      <div><label className="form-label">Contact Person *</label><input {...register('contactPerson')} className="form-input" /></div>
      <div><label className="form-label">Mobile *</label><input {...register('mobile')} type="tel" className="form-input" /></div>
      <div><label className="form-label">Alternate Mobile</label><input {...register('alternateMobile')} type="tel" className="form-input" /></div>
      <div className="sm:col-span-2"><label className="form-label">Address *</label><textarea {...register('address')} className="form-input" rows={2} /></div>
      <div><label className="form-label">Email</label><input {...register('email')} type="email" className="form-input" /></div>
      <div><label className="form-label">Bank Name</label><input {...register('bankName')} className="form-input" /></div>
      <div><label className="form-label">Account Number</label><input {...register('accountNumber')} className="form-input font-mono" /></div>
      <div><label className="form-label">IFSC Code</label><input {...register('ifsc')} className="form-input font-mono uppercase" /></div>
      <div className="sm:col-span-2"><label className="form-label">Remarks</label><input {...register('remarks')} className="form-input" /></div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search vendors..." />
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />Add Vendor</button>
      </div>
      <DataTable columns={columns} data={vendors} />
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Vendor" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Add Vendor</button></>}><FormBody /></Modal>
      <Modal isOpen={!!editVendor} onClose={() => setEditVendor(null)} title="Edit Vendor" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setEditVendor(null)}>Cancel</button><button className="btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}><FormBody /></Modal>
    </div>
  )
}
