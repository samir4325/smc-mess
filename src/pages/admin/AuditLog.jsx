import React, { useState } from 'react'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { useData } from '../../contexts/DataContext'
import { DataTable } from '../../components/shared/DataTable'

export function AuditLog() {
  const { getAuditLogs } = useData()
  const [search, setSearch]   = useState('')
  const [fromDate, setFrom]   = useState('')
  const [toDate, setTo]       = useState('')

  const logs = getAuditLogs().filter(log => {
    const matchSearch =
      (log.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action   || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.entity   || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.recordId || '').toLowerCase().includes(search.toLowerCase())
    const logDate = new Date(log.timestamp)
    const matchFrom = fromDate ? logDate >= new Date(fromDate) : true
    const matchTo   = toDate   ? logDate <= new Date(toDate + 'T23:59:59') : true
    return matchSearch && matchFrom && matchTo
  })

  const trunc = (str, n = 60) => str ? (str.length > n ? str.slice(0, n) + '…' : str) : '—'

  const columns = [
    { header: 'Timestamp', accessor: 'timestamp', cell: r => <span className="text-xs text-gray-500">{r.timestamp ? format(new Date(r.timestamp), 'dd MMM yyyy HH:mm:ss') : '—'}</span> },
    { header: 'User',      accessor: 'userName',   cell: r => <span className="font-medium">{r.userName || '—'}</span> },
    { header: 'Action',    accessor: 'action',     cell: r => <span className="badge bg-blue-100 text-blue-700">{r.action}</span> },
    { header: 'Entity',    accessor: 'entity' },
    { header: 'Record ID', accessor: 'recordId',   cell: r => <span className="font-mono text-xs text-indigo-600">{r.recordId || '—'}</span> },
    { header: 'Old Value', accessor: 'oldValue',   cell: r => <span className="text-xs text-gray-400 font-mono">{trunc(r.oldValue)}</span> },
    { header: 'New Value', accessor: 'newValue',   cell: r => <span className="text-xs text-gray-600 font-mono">{trunc(r.newValue)}</span> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9" placeholder="Search by user, action, entity..." />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>From:</span>
          <input type="date" value={fromDate} onChange={e => setFrom(e.target.value)} className="form-input w-36" />
          <span>To:</span>
          <input type="date" value={toDate} onChange={e => setTo(e.target.value)} className="form-input w-36" />
        </div>
      </div>
      <p className="text-xs text-gray-400">{logs.length} records found</p>
      <DataTable columns={columns} data={logs} emptyMessage="No audit logs found." />
    </div>
  )
}
