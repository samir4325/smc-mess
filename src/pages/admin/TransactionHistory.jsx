import React, { useState } from 'react'
import { format } from 'date-fns'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { StatusBadge } from '../../components/shared/StatusBadge'

export function TransactionHistory() {
  const { getRequests, getPurchases, getGRNs, getShortSupplies, getBills, getPayments, getStockIns, getItems, getVendors } = useData()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})

  const vendors  = Object.fromEntries(getVendors().map(v => [v.id, v.name]))
  const itemsMap = Object.fromEntries(getItems().map(i => [i.id, i]))
  const purchases    = getPurchases()
  const grns         = getGRNs()
  const shortSupplies= getShortSupplies()
  const bills        = getBills()
  const payments     = getPayments()
  const stockIns     = getStockIns()

  const requests = getRequests().filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    (r.itemName || itemsMap[r.itemId]?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const getChain = (req) => {
    const purs   = purchases.filter(p => p.requestId === req.id)
    const purIds = purs.map(p => p.id)
    const relGRNs= grns.filter(g => g.requestId === req.id || purIds.includes(g.purchaseId))
    const relSS  = shortSupplies.filter(s => s.requestId === req.id || purIds.includes(s.purchaseId))
    const relBills = bills.filter(b => purIds.includes(b.purchaseId))
    const billIds  = relBills.map(b => b.id)
    const relPays  = payments.filter(p => billIds.includes(p.billId) || purIds.includes(p.purchaseId))
    const relSI    = stockIns.filter(s => relGRNs.map(g => g.id).includes(s.grnId))
    return { purs, relGRNs, relSS, relBills, relPays, relSI }
  }

  const Row = ({ label, id, status, date, extra }) => (
    <div className="flex items-start gap-3 py-2">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1" />
        <div className="w-0.5 bg-gray-200 flex-1 mt-1 min-h-[16px]" />
      </div>
      <div className="pb-2">
        <p className="text-xs font-semibold text-gray-700">{label} <span className="font-mono text-primary-600">{id}</span></p>
        {status && <StatusBadge status={status} className="mt-0.5" />}
        {date && <p className="text-[10px] text-gray-400 mt-0.5">{date}</p>}
        {extra && <p className="text-xs text-gray-500 mt-0.5">{extra}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search by REQ ID or item name..." />
      </div>

      <div className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No procurement requests found.</p>}
        {requests.map(req => {
          const chain = getChain(req)
          const isOpen = expanded[req.id]
          const itemName = req.itemName || itemsMap[req.itemId]?.name || '—'
          return (
            <div key={req.id} className="card overflow-hidden">
              <button onClick={() => toggle(req.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <span className="font-mono text-sm font-semibold text-primary-700">{req.id}</span>
                  <span className="text-sm text-gray-700">{itemName}</span>
                  <span className="text-sm text-gray-400">{req.requiredQty} {req.unit}</span>
                  <StatusBadge status={req.status} />
                </div>
                <span className="text-xs text-gray-400">{req.createdAt ? format(new Date(req.createdAt), 'dd MMM yyyy') : ''}</span>
              </button>

              {isOpen && (
                <div className="px-6 pb-4 border-t border-gray-50">
                  <div className="mt-3 space-y-0">
                    <Row label="Request" id={req.id} status={req.status} date={req.createdAt ? format(new Date(req.createdAt), 'dd MMM yyyy HH:mm') : ''} extra={`${itemName} — ${req.requiredQty} ${req.unit} | Priority: ${req.priority}`} />
                    {chain.purs.map(p => (
                      <React.Fragment key={p.id}>
                        <Row label="Purchase" id={p.id} status={p.status} date={p.purchaseDate} extra={`Vendor: ${vendors[p.vendorId]||p.vendorId} | Qty: ${p.orderedQty} ${p.unit} | ₹${Number(p.totalAmount||0).toLocaleString()}`} />
                        {chain.relBills.filter(b => b.purchaseId === p.id).map(b => (
                          <Row key={b.id} label="Bill" id={b.id} status={b.verificationStatus || 'pending_verification'} date={b.billDate} extra={`Bill No: ${b.billNumber} | ₹${Number(b.billAmount||0).toLocaleString()} | Payment: ${b.paymentStatus||'pending'}`} />
                        ))}
                        {chain.relPays.filter(pay => pay.purchaseId === p.id).map(pay => (
                          <Row key={pay.id} label="Payment" id={pay.id} status="paid" date={pay.paymentDate} extra={`₹${Number(pay.amount||0).toLocaleString()} via ${pay.paymentMode} | Ref: ${pay.referenceNumber||'—'}`} />
                        ))}
                        {chain.relGRNs.filter(g => g.purchaseId === p.id).map(g => (
                          <Row key={g.id} label="GRN" id={g.id} status={g.shortQty > 0 ? 'short_supply' : 'completed'} date={g.receivedDate} extra={`Ordered: ${g.orderedQty} | Received: ${g.receivedQty} | Short: ${g.shortQty}`} />
                        ))}
                      </React.Fragment>
                    ))}
                    {chain.relSS.map(ss => (
                      <Row key={ss.id} label="Short Supply" id={ss.id} status={ss.status} date={ss.createdAt ? format(new Date(ss.createdAt), 'dd MMM yyyy') : ''} extra={`Type: ${ss.issueType} | Short Qty: ${ss.shortQty}`} />
                    ))}
                    {chain.relSI.map(si => (
                      <Row key={si.id} label="Stock In" id={si.id} date={si.date} extra={`+${si.qty} units added to stock`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
