import React from 'react'
import { useData } from '../../contexts/DataContext'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Tag } from 'lucide-react'

export function StorageCategories() {
  const { getCategories } = useData()
  const categories = getCategories()

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
        Categories are managed by Admin. Contact admin to add or modify categories.
      </div>
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="table-th">ID</th>
              <th className="table-th">Category Name</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="table-td font-mono text-xs text-gray-500">{cat.id}</td>
                <td className="table-td"><div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium">{cat.name}</span></div></td>
                <td className="table-td"><StatusBadge status={cat.isActive ? 'active' : 'inactive'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
