import React from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportToExcel, exportToCSV, exportToPDF } from '../../utils/exportUtils'

export function ExportButton({ data, columns, filename, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium">Export:</span>
      <button
        onClick={() => exportToExcel(data, columns, filename)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Excel
      </button>
      <button
        onClick={() => exportToCSV(data, columns, filename)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        CSV
      </button>
      <button
        onClick={() => exportToPDF(data, columns, filename, title || filename)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        PDF
      </button>
    </div>
  )
}
