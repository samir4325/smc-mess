import React, { createContext, useContext, useState, useCallback } from 'react'
import { ls_get, ls_set } from '../utils/storageHelpers'
import { generateId } from '../data/idGenerators'
import { logAudit } from '../utils/auditLogger'

const DataContext = createContext(null)

// ─── helpers ──────────────────────────────────────────────────────────────────
function nextId(prefix) {
  const counters = ls_get('counters') || {}
  const next = (counters[prefix] || 0) + 1
  ls_set('counters', { ...counters, [prefix]: next })
  return generateId(prefix, next)
}

function now() { return new Date().toISOString() }

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DataProvider({ children }) {
  const [version, setVersion] = useState(0)
  const bump = () => setVersion(v => v + 1)

  // ── Generic getters ────────────────────────────────────────────────────────
  const get   = (key) => ls_get(key) || []
  const getOne = (key, id) => get(key).find(x => x.id === id) || null

  // ── Users ──────────────────────────────────────────────────────────────────
  const getUsers   = () => get('users')
  const addUser    = (data, actor) => {
    const users = get('users')
    const id = nextId('USR')
    const entry = { id, ...data, createdAt: now(), isActive: true }
    ls_set('users', [...users, entry])
    logAudit(actor?.id, actor?.name, 'CREATE', 'User', id, null, entry)
    bump(); return entry
  }
  const updateUser = (id, data, actor) => {
    const users = get('users')
    const old = users.find(u => u.id === id)
    const updated = users.map(u => u.id === id ? { ...u, ...data } : u)
    ls_set('users', updated)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'User', id, old, data)
    bump()
  }
  const deleteUser = (id, actor) => {
    const old = getOne('users', id)
    updateUser(id, { isActive: false }, actor)
    logAudit(actor?.id, actor?.name, 'DEACTIVATE', 'User', id, old, { isActive: false })
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  const getCategories = () => get('categories')
  const addCategory = (data, actor) => {
    const cats = get('categories')
    const id = nextId('CAT')
    const entry = { id, ...data, createdAt: now(), isActive: true }
    ls_set('categories', [...cats, entry])
    logAudit(actor?.id, actor?.name, 'CREATE', 'Category', id, null, entry)
    bump(); return entry
  }
  const updateCategory = (id, data, actor) => {
    const old = getOne('categories', id)
    const cats = get('categories').map(c => c.id === id ? { ...c, ...data } : c)
    ls_set('categories', cats)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'Category', id, old, data)
    bump()
  }

  // ── Items ──────────────────────────────────────────────────────────────────
  const getItems = () => get('items')
  const addItem  = (data, actor) => {
    const items = get('items')
    const id = nextId('ITEM')
    const entry = { id, ...data, createdAt: now(), isActive: true }
    ls_set('items', [...items, entry])
    logAudit(actor?.id, actor?.name, 'CREATE', 'Item', id, null, entry)
    bump(); return entry
  }
  const updateItem = (id, data, actor) => {
    const old = getOne('items', id)
    const items = get('items').map(i => i.id === id ? { ...i, ...data } : i)
    ls_set('items', items)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'Item', id, old, data)
    bump()
  }
  const updateMinStock = (id, minStockLimit, actor) => {
    updateItem(id, { minStockLimit: Number(minStockLimit) }, actor)
  }

  // ── Vendors ────────────────────────────────────────────────────────────────
  const getVendors = () => get('vendors')
  const addVendor  = (data, actor) => {
    const vendors = get('vendors')
    const id = nextId('VEN')
    const entry = { id, ...data, createdAt: now(), isActive: true }
    ls_set('vendors', [...vendors, entry])
    logAudit(actor?.id, actor?.name, 'CREATE', 'Vendor', id, null, entry)
    bump(); return entry
  }
  const updateVendor = (id, data, actor) => {
    const old = getOne('vendors', id)
    const vendors = get('vendors').map(v => v.id === id ? { ...v, ...data } : v)
    ls_set('vendors', vendors)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'Vendor', id, old, data)
    bump()
  }

  // ── Procurement Requests ───────────────────────────────────────────────────
  const getRequests = () => get('procurementRequests')
  const addRequest  = (data, actor, addNotification) => {
    const reqs = get('procurementRequests')
    const id = nextId('REQ')
    const entry = { id, ...data, status: 'pending', createdAt: now(), requestedBy: actor?.name }
    ls_set('procurementRequests', [...reqs, entry])
    logAudit(actor?.id, actor?.name, 'CREATE', 'ProcurementRequest', id, null, entry)
    addNotification?.('procurement', `New procurement request ${id} for ${data.itemName} (${data.requiredQty} ${data.unit})`, 'info', id)
    addNotification?.('admin', `New procurement request ${id} submitted by Storage.`, 'info', id)
    bump(); return entry
  }
  const updateRequest = (id, data, actor) => {
    const old = getOne('procurementRequests', id)
    const reqs = get('procurementRequests').map(r => r.id === id ? { ...r, ...data } : r)
    ls_set('procurementRequests', reqs)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'ProcurementRequest', id, old, data)
    bump()
  }

  // ── Purchases ──────────────────────────────────────────────────────────────
  const getPurchases = () => get('purchases')
  const addPurchase  = (data, actor, addNotification) => {
    const purchases = get('purchases')
    const id = nextId('PUR')
    const entry = {
      id,
      ...data,
      status: 'ordered',
      createdAt: now(),
      createdBy: actor?.name,
    }
    ls_set('purchases', [...purchases, entry])
    // Update request status
    if (data.requestId) updateRequest(data.requestId, { status: 'ordered', purchaseId: id }, actor)
    logAudit(actor?.id, actor?.name, 'CREATE', 'Purchase', id, null, entry)
    addNotification?.('storage', `Purchase ${id} placed for ${data.itemName} (${data.orderedQty} ${data.unit}). Expected: ${data.expectedDelivery}`, 'info', id)
    addNotification?.('account', `New purchase ${id} created. Bill pending from Procurement.`, 'info', id)
    addNotification?.('admin', `Purchase ${id} placed by Procurement.`, 'info', id)
    bump(); return entry
  }
  const updatePurchase = (id, data, actor) => {
    const old = getOne('purchases', id)
    const purchases = get('purchases').map(p => p.id === id ? { ...p, ...data } : p)
    ls_set('purchases', purchases)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'Purchase', id, old, data)
    bump()
  }

  // ── GRNs ───────────────────────────────────────────────────────────────────
  const getGRNs   = () => get('grns')
  const addGRN    = (data, actor, addNotification) => {
    const grns = get('grns')
    const id   = nextId('GRN')
    const shortQty = Math.max(0, Number(data.orderedQty) - Number(data.receivedQty))
    const entry = { id, ...data, shortQty, createdAt: now(), createdBy: actor?.name }
    ls_set('grns', [...grns, entry])

    // Add Stock In
    const stockIns = get('stockIns')
    const siId = `STIN-${Date.now()}`
    const stockIn = { id: siId, grnId: id, itemId: data.itemId, qty: Number(data.receivedQty), date: data.receivedDate || now(), createdAt: now() }
    ls_set('stockIns', [...stockIns, stockIn])

    // Update item stock
    const items = get('items')
    const item  = items.find(i => i.id === data.itemId)
    if (item) {
      const newStock = (item.currentStock || 0) + Number(data.receivedQty)
      updateItem(data.itemId, { currentStock: newStock }, actor)
    }

    // Update purchase status
    if (data.purchaseId) {
      const allGRNs = [...grns, entry]
      const purchaseGRNs = allGRNs.filter(g => g.purchaseId === data.purchaseId)
      const totalReceived = purchaseGRNs.reduce((sum, g) => sum + Number(g.receivedQty), 0)
      const purchase = getOne('purchases', data.purchaseId)
      if (purchase) {
        const purchaseStatus = totalReceived >= Number(purchase.orderedQty) ? 'fully_received' : 'partially_received'
        updatePurchase(data.purchaseId, { status: purchaseStatus, totalReceived }, actor)
        if (data.requestId) updateRequest(data.requestId, { status: purchaseStatus === 'fully_received' ? 'fully_received' : 'partially_received' }, actor)
      }
    }

    // Auto short supply
    if (shortQty > 0) {
      const ssId = nextId('SS')
      const ss = {
        id: ssId,
        grnId: id,
        purchaseId: data.purchaseId,
        requestId: data.requestId,
        itemId: data.itemId,
        itemName: data.itemName,
        shortQty,
        issueType: 'short_quantity',
        status: 'open',
        createdAt: now(),
        createdBy: actor?.name,
      }
      ls_set('shortSupplies', [...(get('shortSupplies') || []), ss])
      logAudit(actor?.id, actor?.name, 'CREATE', 'ShortSupply', ssId, null, ss)
      addNotification?.('procurement', `Short supply of ${shortQty} ${data.unit || ''} for ${data.itemName} (GRN: ${id}).`, 'warning', ssId)
      addNotification?.('account', `Short supply reported for Purchase ${data.purchaseId}. Received: ${data.receivedQty}, Short: ${shortQty}`, 'warning', ssId)
      addNotification?.('admin', `Short supply ${ssId} created from GRN ${id}.`, 'warning', ssId)
    }

    logAudit(actor?.id, actor?.name, 'CREATE', 'GRN', id, null, entry)
    addNotification?.('procurement', `GRN ${id} created. Received ${data.receivedQty} of ${data.orderedQty} ${data.unit || ''}.`, 'success', id)
    addNotification?.('account', `GRN ${id} received. Material confirmation available.`, 'success', id)
    bump(); return entry
  }

  // ── Stock Out ──────────────────────────────────────────────────────────────
  const getStockOuts = () => get('stockOuts')
  const addStockOut  = (data, actor) => {
    const item = getOne('items', data.itemId)
    if (!item) throw new Error('Item not found')
    if (Number(data.qty) > item.currentStock) throw new Error(`Cannot issue more than available stock (${item.currentStock} ${item.unit})`)
    const stockOuts = get('stockOuts')
    const id = nextId('STKOUT')
    const entry = { id, ...data, createdAt: now(), createdBy: actor?.name }
    ls_set('stockOuts', [...stockOuts, entry])
    updateItem(data.itemId, { currentStock: item.currentStock - Number(data.qty) }, actor)
    logAudit(actor?.id, actor?.name, 'CREATE', 'StockOut', id, null, entry)
    bump(); return entry
  }

  // ── Short Supplies ─────────────────────────────────────────────────────────
  const getShortSupplies = () => get('shortSupplies')
  const updateShortSupply = (id, data, actor) => {
    const old = getOne('shortSupplies', id)
    const ss = get('shortSupplies').map(s => s.id === id ? { ...s, ...data } : s)
    ls_set('shortSupplies', ss)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'ShortSupply', id, old, data)
    bump()
  }
  const addManualIssue = (data, actor, addNotification) => {
    const ss = get('shortSupplies')
    const id = nextId('SS')
    const entry = { id, ...data, status: 'open', createdAt: now(), createdBy: actor?.name }
    ls_set('shortSupplies', [...ss, entry])
    logAudit(actor?.id, actor?.name, 'CREATE', 'ShortSupply', id, null, entry)
    addNotification?.('procurement', `Issue reported: ${data.issueType} — ${data.itemName}. ${data.remarks || ''}`, 'warning', id)
    addNotification?.('account', `Delivery issue reported for Purchase ${data.purchaseId}.`, 'warning', id)
    bump(); return entry
  }

  // ── Bills ──────────────────────────────────────────────────────────────────
  const getBills = () => get('bills')
  const addBill  = (data, actor, addNotification) => {
    const bills = get('bills')
    const id = nextId('BILL')
    // duplicate bill number warning (handled in component)
    const entry = { id, ...data, verificationStatus: 'pending', createdAt: now(), createdBy: actor?.name }
    ls_set('bills', [...bills, entry])
    logAudit(actor?.id, actor?.name, 'CREATE', 'Bill', id, null, entry)
    addNotification?.('account', `New bill ${id} uploaded for Purchase ${data.purchaseId}. Amount: ₹${data.billAmount}`, 'info', id)
    addNotification?.('admin', `Bill ${id} uploaded by Procurement.`, 'info', id)
    bump(); return entry
  }
  const updateBill = (id, data, actor, addNotification) => {
    const old = getOne('bills', id)
    const bills = get('bills').map(b => b.id === id ? { ...b, ...data } : b)
    ls_set('bills', bills)
    logAudit(actor?.id, actor?.name, 'UPDATE', 'Bill', id, old, data)
    if (data.verificationStatus === 'correction_required') {
      addNotification?.('procurement', `Bill ${id} requires correction. Review and re-upload.`, 'warning', id)
    }
    if (data.verificationStatus === 'rejected') {
      addNotification?.('procurement', `Bill ${id} was rejected by Account Committee.`, 'error', id)
    }
    bump()
  }

  // ── Payments ───────────────────────────────────────────────────────────────
  const getPayments = () => get('payments')
  const addPayment  = (data, actor, addNotification) => {
    const payments = get('payments')
    const id = nextId('PAY')
    const entry = { id, ...data, createdAt: now(), createdBy: actor?.name }
    ls_set('payments', [...payments, entry])

    // Compute totals for the bill
    const allPayments = [...payments, entry]
    const bill = getOne('bills', data.billId)
    if (bill) {
      const totalPaid = allPayments.filter(p => p.billId === data.billId).reduce((s, p) => s + Number(p.amount), 0)
      const remaining = Number(bill.billAmount) - totalPaid
      const payStatus = remaining <= 0 ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'pending'
      updateBill(data.billId, { paidAmount: totalPaid, remaining, paymentStatus: payStatus }, actor, addNotification)
      updatePurchase(data.purchaseId, { paymentStatus: payStatus, paidAmount: totalPaid }, actor)
      const msg = payStatus === 'paid'
        ? `Payment ${id}: ₹${data.amount} — Purchase ${data.purchaseId} fully paid ✅`
        : `Payment ${id}: ₹${data.amount} paid. Remaining ₹${remaining} for Purchase ${data.purchaseId}`
      addNotification?.('procurement', msg, payStatus === 'paid' ? 'success' : 'info', id)
      addNotification?.('admin', `Payment ${id} recorded by Account.`, 'info', id)
    }

    logAudit(actor?.id, actor?.name, 'CREATE', 'Payment', id, null, entry)
    bump(); return entry
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  const getAuditLogs = () => ls_get('auditLogs') || []
  const getStockIns  = () => get('stockIns')

  const value = {
    version,
    // Users
    getUsers, addUser, updateUser, deleteUser,
    // Categories
    getCategories, addCategory, updateCategory,
    // Items
    getItems, addItem, updateItem, updateMinStock,
    // Vendors
    getVendors, addVendor, updateVendor,
    // Requests
    getRequests, addRequest, updateRequest,
    // Purchases
    getPurchases, addPurchase, updatePurchase,
    // GRNs
    getGRNs, addGRN,
    // Stock
    getStockOuts, addStockOut, getStockIns,
    // Short Supplies
    getShortSupplies, updateShortSupply, addManualIssue,
    // Bills
    getBills, addBill, updateBill,
    // Payments
    getPayments, addPayment,
    // Audit
    getAuditLogs,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
