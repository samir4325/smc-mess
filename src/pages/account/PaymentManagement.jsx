import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { CreditCard, Plus, Eye, History } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

const paymentModes = ['Cash', 'NEFT', 'RTGS', 'UPI', 'Cheque', 'DD']

const schema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Date required'),
  paymentMode: z.string().min(1, 'Mode required'),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
})

export function PaymentManagement() {
  const { getBills, getPayments, addPayment, getVendors, getPurchases } = useData()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()

  const [paymentModalBill, setPaymentModalBill] = useState(null)
  const [historyModalBill, setHistoryModalBill] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const vendors = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const purchases = Object.fromEntries(getPurchases().map(p => [p.id, p]))
  const payments = getPayments()

  const bills = getBills().map(b => {
    const p = purchases[b.purchaseId]
    const bPayments = payments.filter(pay => pay.billId === b.id)
    const paidAmount = bPayments.reduce((s, pay) => s + Number(pay.amount || 0), 0)
    const remaining = Math.max(0, Number(b.billAmount || 0) - paidAmount)
    const paymentStatus = remaining <= 0 ? 'paid' : paidAmount > 0 ? 'partially_paid' : 'pending'
    return {
      ...b,
      vendorName: vendors[b.vendorId] || b.vendorId || '—',
      itemName: p?.itemName || '—',
      paidAmount,
      remaining,
      computedPaymentStatus: paymentStatus,
    }
  }).filter(b => statusFilter ? b.computedPaymentStatus === statusFilter : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMode: 'UPI'
    }
  })

  const enteredAmount = Number(watch('amount') || 0)
  const isOverpaying = paymentModalBill && enteredAmount > paymentModalBill.remaining

  const openPaymentModal = (bill) => {
    setPaymentModalBill(bill)
    reset({
      amount: bill.remaining,
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMode: 'UPI',
      referenceNumber: '',
      remarks: ''
    })
  }

  const onPaymentSubmit = (data) => {
    if (!paymentModalBill) return

    const payload = {
      billId: paymentModalBill.id,
      purchaseId: paymentModalBill.purchaseId,
      vendorId: paymentModalBill.vendorId,
      ...data,
      amount: Number(data.amount),
    }

    try {
      const pay = addPayment(payload, currentUser, addNotification)
      toast.success(`Payment ${pay.id} recorded for ₹${Number(data.amount).toLocaleString()}!`)
      setPaymentModalBill(null)
      reset()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    { header: 'Bill ID', accessor: 'id', cell: r => <span className="font-mono text-xs font-semibold text-indigo-700">{r.id}</span> },
    { header: 'Purchase ID', accessor: 'purchaseId', cell: r => <span className="font-mono text-xs text-gray-500">{r.purchaseId}</span> },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Bill Amount', accessor: 'billAmount', cell: r => `₹${Number(r.billAmount || 0).toLocaleString()}` },
    { header: 'Paid Amount', accessor: 'paidAmount', cell: r => <span className="text-emerald-700 font-semibold">₹{Number(r.paidAmount || 0).toLocaleString()}</span> },
    { header: 'Remaining', accessor: 'remaining', cell: r => <span className={r.remaining > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>₹{Number(r.remaining || 0).toLocaleString()}</span> },
    { header: 'Status', accessor: 'computedPaymentStatus', cell: r => <StatusBadge status={r.computedPaymentStatus} /> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <div className="flex gap-2">
          {r.remaining > 0 && (
            <button onClick={() => openPaymentModal(r)} className="btn-primary text-xs py-1 px-2.5">
              <CreditCard className="w-3.5 h-3.5" /> Pay
            </button>
          )}
          <button onClick={() => setHistoryModalBill(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Payment History">
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ]

  const historyPayments = historyModalBill ? payments.filter(p => p.billId === historyModalBill.id) : []

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-44">
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <DataTable columns={columns} data={bills} emptyMessage="No bills found for payment." />

      {/* Record Payment Modal */}
      {paymentModalBill && (
        <Modal isOpen title={`Record Payment for ${paymentModalBill.id}`} onClose={() => setPaymentModalBill(null)} size="md"
          footer={<>
            <button className="btn-secondary" onClick={() => setPaymentModalBill(null)}>Cancel</button>
            <button className="btn-success" onClick={handleSubmit(onPaymentSubmit)} disabled={isOverpaying}>
              <CreditCard className="w-4 h-4" /> Confirm Payment
            </button>
          </>}>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p>Vendor: <strong>{paymentModalBill.vendorName}</strong></p>
              <p>Total Bill: ₹{Number(paymentModalBill.billAmount || 0).toLocaleString()}</p>
              <p>Already Paid: <span className="text-emerald-600 font-semibold">₹{Number(paymentModalBill.paidAmount || 0).toLocaleString()}</span></p>
              <p>Remaining: <strong className="text-red-600">₹{Number(paymentModalBill.remaining || 0).toLocaleString()}</strong></p>
            </div>

            <div>
              <label className="form-label">Payment Amount (₹) *</label>
              <input {...register('amount')} type="number" step="0.01" className={`form-input ${isOverpaying ? 'border-red-400 bg-red-50' : ''}`} />
              {isOverpaying && <p className="form-error">Amount exceeds outstanding bill balance.</p>}
              {errors.amount && <p className="form-error">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Payment Date *</label>
                <input {...register('paymentDate')} type="date" className="form-input" />
                {errors.paymentDate && <p className="form-error">{errors.paymentDate.message}</p>}
              </div>
              <div>
                <label className="form-label">Payment Mode *</label>
                <select {...register('paymentMode')} className="form-select">
                  {paymentModes.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Transaction / Reference Number</label>
              <input {...register('referenceNumber')} className="form-input font-mono" placeholder="e.g. UTR / Cheque No." />
            </div>

            <div>
              <label className="form-label">Remarks</label>
              <input {...register('remarks')} className="form-input" placeholder="Notes..." />
            </div>
          </div>
        </Modal>
      )}

      {/* Payment History Modal */}
      {historyModalBill && (
        <Modal isOpen title={`Payment History — ${historyModalBill.id}`} onClose={() => setHistoryModalBill(null)} size="md"
          footer={<button className="btn-secondary" onClick={() => setHistoryModalBill(null)}>Close</button>}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium uppercase">Transactions for Vendor: {historyModalBill.vendorName}</p>
            {historyPayments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No payment transactions recorded for this bill.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyPayments.map(p => (
                  <div key={p.id} className="py-2 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-mono text-xs font-semibold text-emerald-700">{p.id}</p>
                      <p className="text-xs text-gray-400">{p.paymentDate} · {p.paymentMode} {p.referenceNumber ? `(${p.referenceNumber})` : ''}</p>
                    </div>
                    <span className="font-bold text-emerald-600">₹{Number(p.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
