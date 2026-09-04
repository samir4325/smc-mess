import React from 'react'
import { format, addDays, isWithinInterval } from 'date-fns'
import { Package, AlertTriangle, TrendingDown, ClipboardList, Truck, PackagePlus, PackageMinus, ShoppingCart } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { StatCard } from '../../components/shared/StatCard'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { getStockStatus, STOCK_STATUS } from '../../utils/stockCalculator'

export function StorageDashboard() {
  const { getItems, getCategories, getRequests, getPurchases, getGRNs, getStockIns, getStockOuts } = useData()

  const items     = getItems()
  const categories= getCategories()
  const requests  = getRequests()
  const purchases = getPurchases()
  const grns      = getGRNs()
  const stockIns  = getStockIns()
  const stockOuts = getStockOuts()
  const catMap    = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const inStock  = items.filter(i => getStockStatus(i.currentStock, i.minStockLimit) === STOCK_STATUS.IN_STOCK)
  const lowStock = items.filter(i => getStockStatus(i.currentStock, i.minStockLimit) === STOCK_STATUS.LOW_STOCK)
  const outStock = items.filter(i => getStockStatus(i.currentStock, i.minStockLimit) === STOCK_STATUS.OUT_OF_STOCK)

  const pendingReqs = requests.filter(r => r.status === 'pending').length
  const orderedPurs = purchases.filter(p => p.status === 'ordered' || p.status === 'partially_received')

  // Expected deliveries within next 7 days
  const today = new Date()
  const next7 = addDays(today, 7)
  const expectedDeliveries = orderedPurs.filter(p => {
    if (!p.expectedDelivery) return false
    try { return isWithinInterval(new Date(p.expectedDelivery), { start: today, end: next7 }) } catch { return false }
  })

  // Purchases without GRN (pending GRN)
  const grnPurchaseIds = new Set(grns.map(g => g.purchaseId))
  const pendingGRNs = orderedPurs.filter(p => !grnPurchaseIds.has(p.id))

  const itemsMap = Object.fromEntries(items.map(i => [i.id, i]))
  const recentStockIns  = [...stockIns].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const recentStockOuts = [...stockOuts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Items"          value={items.length}            icon={Package}       color="blue" />
        <StatCard title="In Stock"             value={inStock.length}          icon={Package}       color="green" />
        <StatCard title="Low Stock"            value={lowStock.length}         icon={AlertTriangle} color="amber" />
        <StatCard title="Out of Stock"         value={outStock.length}         icon={TrendingDown}  color="red" />
        <StatCard title="Pending Requests"     value={pendingReqs}             icon={ClipboardList} color="indigo" />
        <StatCard title="Items Ordered"        value={orderedPurs.length}      icon={ShoppingCart}  color="purple" />
        <StatCard title="Expected (7 days)"    value={expectedDeliveries.length} icon={Truck}       color="blue" />
        <StatCard title="Pending GRNs"         value={pendingGRNs.length}      icon={Truck}         color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Low Stock Items ({lowStock.length})
          </h3>
          {lowStock.length === 0 ? <p className="text-sm text-gray-400">All items above minimum level.</p> : (
            <div className="divide-y divide-gray-50">
              {lowStock.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{catMap[item.categoryId] || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-600">{item.currentStock} {item.unit}</p>
                    <p className="text-xs text-gray-400">Min: {item.minStockLimit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out of Stock */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Out of Stock ({outStock.length})
          </h3>
          {outStock.length === 0 ? <p className="text-sm text-gray-400">No items out of stock.</p> : (
            <div className="divide-y divide-gray-50">
              {outStock.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{catMap[item.categoryId] || '—'}</p>
                  </div>
                  <StatusBadge status="out_of_stock" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock In */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-green-600" /> Recent Stock In
          </h3>
          {recentStockIns.length === 0 ? <p className="text-sm text-gray-400">No stock-in records yet.</p> : (
            <div className="divide-y divide-gray-50">
              {recentStockIns.map(si => (
                <div key={si.id} className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{itemsMap[si.itemId]?.name || si.itemId}</p>
                    <p className="text-xs text-gray-400">GRN: {si.grnId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">+{si.qty} {itemsMap[si.itemId]?.unit}</p>
                    <p className="text-xs text-gray-400">{si.date ? format(new Date(si.date), 'dd MMM') : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Out */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PackageMinus className="w-4 h-4 text-red-500" /> Recent Stock Out
          </h3>
          {recentStockOuts.length === 0 ? <p className="text-sm text-gray-400">No stock-out records yet.</p> : (
            <div className="divide-y divide-gray-50">
              {recentStockOuts.map(so => (
                <div key={so.id} className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{itemsMap[so.itemId]?.name || so.itemId}</p>
                    <p className="text-xs text-gray-400">{so.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">-{so.qty} {itemsMap[so.itemId]?.unit}</p>
                    <p className="text-xs text-gray-400">{so.date ? format(new Date(so.date), 'dd MMM') : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
