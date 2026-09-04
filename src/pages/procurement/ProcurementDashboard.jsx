import React from 'react'
import { ClipboardList, ShoppingCart, Truck, AlertTriangle, CheckCircle, CreditCard, Receipt, Clock } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { StatCard } from '../../components/shared/StatCard'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { format } from 'date-fns'

export function ProcurementDashboard() {
  const { getRequests, getPurchases, getBills, getPayments, getShortSupplies } = useData()

  const requests  = getRequests()
  const purchases = getPurchases()
  const bills     = getBills()
  const payments  = getPayments()
  const ss        = getShortSupplies()

  const newReqs    = requests.filter(r => r.status === 'pending').length
  const approved   = requests.filter(r => r.status === 'approved').length
  const ordered    = purchases.filter(p => p.status === 'ordered').length
  const partial    = purchases.filter(p => p.status === 'partially_received').length
  const openSS     = ss.filter(s => s.status === 'open').length
  const completed  = purchases.filter(p => p.status === 'fully_received' || p.status === 'completed').length
  const pendingPay = bills.filter(b => !b.paymentStatus || b.paymentStatus === 'pending').length
  const partialPay = bills.filter(b => b.paymentStatus === 'partially_paid').length
  const paid       = bills.filter(b => b.paymentStatus === 'paid').length

  const recentRequests = [...requests].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5)
  const recentPurchases= [...purchases].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="New Requests"    value={newReqs}   icon={ClipboardList}  color="indigo" />
        <StatCard title="Approved"        value={approved}  icon={CheckCircle}    color="green" />
        <StatCard title="Orders Placed"   value={ordered}   icon={ShoppingCart}   color="blue" />
        <StatCard title="Partial Delivery"value={partial}   icon={Truck}          color="amber" />
        <StatCard title="Short Supply"    value={openSS}    icon={AlertTriangle}  color="red" />
        <StatCard title="Completed"       value={completed} icon={CheckCircle}    color="green" />
        <StatCard title="Pending Payments"value={pendingPay}icon={Clock}          color="amber" />
        <StatCard title="Paid"            value={paid}      icon={CreditCard}     color="green" />
        <StatCard title="Total Bills"     value={bills.length} icon={Receipt}     color="purple" />
        <StatCard title="Partially Paid"  value={partialPay}icon={CreditCard}     color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Storage Requests</h3>
          <div className="divide-y divide-gray-50">
            {recentRequests.length === 0 ? <p className="text-sm text-gray-400">No requests yet.</p> :
              recentRequests.map(r => (
                <div key={r.id} className="flex justify-between items-center py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.itemName}</p>
                    <p className="text-xs text-gray-400">{r.id} · {r.requiredQty} {r.unit}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            }
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Purchases</h3>
          <div className="divide-y divide-gray-50">
            {recentPurchases.length === 0 ? <p className="text-sm text-gray-400">No purchases yet.</p> :
              recentPurchases.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.itemName || p.id}</p>
                    <p className="text-xs text-gray-400">{p.id} · {p.orderedQty} {p.unit} · ₹{Number(p.totalAmount||0).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={p.status} />
                    {p.paymentStatus && <StatusBadge status={p.paymentStatus} />}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {openSS > 0 && (
        <div className="card p-5 border-l-4 border-orange-400">
          <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Open Short Supply Issues ({openSS})</h3>
          <div className="divide-y divide-gray-50">
            {getShortSupplies().filter(s => s.status === 'open').map(ss => (
              <div key={ss.id} className="flex justify-between items-center py-2">
                <p className="text-sm text-gray-700">{ss.itemName} — Short: <strong>{ss.shortQty}</strong></p>
                <StatusBadge status={ss.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
