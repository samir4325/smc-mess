import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

// ─── Excel / CSV ──────────────────────────────────────────────────────────────
export function exportToExcel(data, columns, filename) {
  const rows = data.map(row => {
    const obj = {}
    columns.forEach(col => {
      obj[col.header] = col.accessor ? row[col.accessor] : (col.render ? col.render(row) : '')
    })
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export function exportToCSV(data, columns, filename) {
  const rows = data.map(row =>
    columns.map(col =>
      col.accessor ? (row[col.accessor] ?? '') : (col.render ? col.render(row) : '')
    )
  )
  const headers = columns.map(c => c.header)
  const csvContent = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(data, columns, filename, title) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(title, 14, 15)
  doc.setFontSize(9)
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 22)

  const rows = data.map(row =>
    columns.map(col =>
      col.accessor ? (row[col.accessor] ?? '') : (col.render ? col.render(row) : '')
    )
  )

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// ─── Column definitions by role ───────────────────────────────────────────────
export const STORAGE_STOCK_COLUMNS = [
  { header: 'Item Name',         accessor: 'name' },
  { header: 'Category',          accessor: 'categoryName' },
  { header: 'Unit',              accessor: 'unit' },
  { header: 'Current Stock',     accessor: 'currentStock' },
  { header: 'Min Stock Limit',   accessor: 'minStockLimit' },
  { header: 'Stock Status',      accessor: 'stockStatus' },
  { header: 'Remarks',           accessor: 'remarks' },
]

export const STORAGE_GRN_COLUMNS = [
  { header: 'GRN Number',        accessor: 'id' },
  { header: 'Purchase ID',       accessor: 'purchaseId' },
  { header: 'Request ID',        accessor: 'requestId' },
  { header: 'Item',              accessor: 'itemName' },
  { header: 'Ordered Qty',       accessor: 'orderedQty' },
  { header: 'Received Qty',      accessor: 'receivedQty' },
  { header: 'Short Qty',         accessor: 'shortQty' },
  { header: 'Unit',              accessor: 'unit' },
  { header: 'Received Date',     accessor: 'receivedDate' },
  { header: 'Condition',         accessor: 'condition' },
  { header: 'Remarks',           accessor: 'remarks' },
]

export const PROCUREMENT_PURCHASE_COLUMNS = [
  { header: 'Purchase ID',       accessor: 'id' },
  { header: 'Request ID',        accessor: 'requestId' },
  { header: 'Item',              accessor: 'itemName' },
  { header: 'Category',          accessor: 'categoryName' },
  { header: 'Ordered Qty',       accessor: 'orderedQty' },
  { header: 'Unit',              accessor: 'unit' },
  { header: 'Vendor',            accessor: 'vendorName' },
  { header: 'Purchase Date',     accessor: 'purchaseDate' },
  { header: 'Expected Delivery', accessor: 'expectedDelivery' },
  { header: 'Rate',              accessor: 'rate' },
  { header: 'Total Amount',      accessor: 'totalAmount' },
  { header: 'Status',            accessor: 'status' },
]

export const ACCOUNT_BILL_COLUMNS = [
  { header: 'Bill ID',           accessor: 'id' },
  { header: 'Purchase ID',       accessor: 'purchaseId' },
  { header: 'Vendor',            accessor: 'vendorName' },
  { header: 'Bill Number',       accessor: 'billNumber' },
  { header: 'Bill Date',         accessor: 'billDate' },
  { header: 'Bill Amount',       accessor: 'billAmount' },
  { header: 'Paid Amount',       accessor: 'paidAmount' },
  { header: 'Remaining',         accessor: 'remaining' },
  { header: 'Payment Status',    accessor: 'paymentStatus' },
  { header: 'Verification',      accessor: 'verificationStatus' },
]
