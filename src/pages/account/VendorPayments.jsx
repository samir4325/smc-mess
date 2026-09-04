import React, { useState } from 'react'
import { Search, Eye, Store, Phone, MapPin } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Modal } from '../../components/shared/Modal'

export function VendorPayments() {
  const { getVendors, getPurchases, getBills, getPayments } = useData()
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState(null)

  const vendors = getVendors()
  const purchases = getPurchases()
  const bills = getBills()
  const payments = getPayments()

  const vendorData = vendors.map(v => {
    const vPurchases = purchases.filter(p => p.vendorId === v.id)
    const vBills = bills.filter(b => b.vendorId === v.id)
    const totalBilled = vBills.reduce((s, b) => s + Number(b.billAmount || 0), 0)
    const totalPaid = payments.filter(p => p.vendorId === v.id || vBills.some(b => b.id === p.billId)).reduce((s, p) => s + Number(p.amount || 0), 0)
    const totalPending = Math.max(0, totalBilled - totalPaid)
    const status = totalBilled > 0 && totalPending === 0 ? 'paid' : totalPaid > 0 ? 'partially_paid' : totalBilled > 0 ? 'pending' : 'draft'

    return {
      ...v,
      totalPurchasesCount: vPurchases.length,
      totalBilled,
      totalPaid,
      totalPending,
      paymentStatus: status,
    }
  }).filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.mobile || '').includes(search)
  )

  const columns = [
    { header: 'Vendor ID', accessor: 'id', cell: r => <span className="font-mono text-xs text-gray-500">{r.id}</span> },
    { header: 'Shop/Vendor', accessor: 'name', cell: r => <span className="font-semibold text-gray-900">{r.name}</span> },
    { header: 'Contact Person', accessor: 'contactPerson' },
    { header: 'Mobile', accessor: 'mobile' },
    { header: 'Total Orders', accessor: 'totalPurchasesCount' },
    { header: 'Total Billed (₹)', accessor: 'totalBilled', cell: r => `₹${r.totalBilled.toLocaleString()}` },
    { header: 'Total Paid (₹)', accessor: 'totalPaid', cell: r => <span className="text-emerald-700 font-semibold">₹{r.totalPaid.toLocaleString()}</span> },
    { header: 'Pending (₹)', accessor: 'totalPending', cell: r => <span className={r.totalPending > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>₹{r.totalPending.toLocaleString()}</span> },
    { header: 'Status', accessor: 'paymentStatus', cell: r => <StatusBadge status={r.paymentStatus} /> },
    {
      header: 'Actions', sortable: false,
      cell: r => (
        <button onClick={() => setSelectedVendor(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View Vendor Ledger">
          <Eye className="w-3.5 h-3.5" />
        </button>
      )
    }
  ]

  const vendorBills = selectedVendor ? bills.filter(b => b.vendorId === selectedVendor.id) : []
  const vendorPayments = selectedVendor ? payments.filter(p => p.vendorId === selectedVendor.id || vendorBills.some(b => b.id === p.billId)) : []

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search vendor by name or mobile..." />
      </div>

      <DataTable columns={columns} data={vendorData} emptyMessage="No vendors found." />

      {/* Vendor Ledger Modal */}
      {selectedVendor && (
        <Modal isOpen title={`Vendor Ledger — ${selectedVendor.name}`} onClose={() => setSelectedVendor(null)} size="xl"
          footer={<button className="btn-secondary" onClick={() => setSelectedVendor(null)}>Close</button>}>
          <div className="space-y-5">
            {/* Vendor info card */}
            <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Contact</p><p className="font-medium">{selectedVendor.contactPerson} ({selectedVendor.mobile})</p></div>
              <div><p className="text-xs text-gray-500">Bank Details</p><p className="font-medium">{selectedVendor.bankName || '—'}</p><p className="font-mono text-xs text-gray-600">A/C: {selectedVendor.accountNumber || '—'} · IFSC: {selectedVendor.ifsc || '—'}</p></div>
              <div><p className="text-xs text-gray-500">Address</p><p className="text-xs text-gray-700">{selectedVendor.address}</p></div>
            </div>

            {/* Bills */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Bills from {selectedVendor.name}</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-100 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-th">Bill ID</th>
                      <th className="table-th">Bill No</th>
                      <th className="table-th">Date</th>
                      <th className="table-th text-right">Amount</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vendorBills.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-gray-400">No bills uploaded.</td></tr>
                    ) : (
                      vendorBills.map(b => (
                        <tr key={b.id}>
                          <td className="table-td font-mono">{b.id}</td>
                          <td className="table-td">{b.billNumber}</td>
                          <td className="table-td">{b.billDate}</td>
                          <td className="table-td text-right font-semibold">₹{Number(b.billAmount || 0).toLocaleString()}</td>
                          <td className="table-td"><StatusBadge status={b.paymentStatus || 'pending'} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Payments Made to {selectedVendor.name}</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-100 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-th">Payment ID</th>
                      <th className="table-th">Bill ID</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Mode & Ref</th>
                      <th className="table-th text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vendorPayments.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-gray-400">No payments made.</td></tr>
                    ) : (
                      vendorPayments.map(p => (
                        <tr key={p.id}>
                          <td className="table-td font-mono text-emerald-700 font-semibold">{p.id}</td>
                          <td className="table-td font-mono text-gray-500">{p.billId}</td>
                          <td className="table-td">{p.paymentDate}</td>
                          <td className="table-td">{p.paymentMode} {p.referenceNumber ? `(${p.referenceNumber})` : ''}</td>
                          <td className="table-td text-right text-emerald-600 font-bold">₹{Number(p.amount).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
