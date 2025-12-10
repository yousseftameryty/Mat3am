'use client'

import { useState, useMemo } from 'react'
import { Search, Download, Filter, X } from 'lucide-react'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  changes: any
  ip_address: string | null
  user_agent: string | null
  timestamp: string
  profiles: {
    full_name: string
    role: string
  } | null
}

interface AuditLogViewerProps {
  initialLogs: AuditLog[]
}

export default function AuditLogViewer({ initialLogs }: AuditLogViewerProps) {
  const [logs] = useState<AuditLog[]>(initialLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [filterActor, setFilterActor] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const entityTypes = ['all', ...Array.from(new Set(logs.map(log => log.entity_type).filter((type): type is string => Boolean(type))))]
  const actors = ['all', ...Array.from(new Set(logs.map(log => log.profiles?.full_name).filter((name): name is string => Boolean(name))))]

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity
      const matchesActor = filterActor === 'all' || log.profiles?.full_name === filterActor

      return matchesSearch && matchesEntity && matchesActor
    })
  }, [logs, searchQuery, filterEntity, filterActor])

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'IP Address']
    const rows = filteredLogs.map(log => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.profiles?.full_name || 'System',
      log.action,
      log.entity_type || '—',
      log.entity_id || '—',
      log.ip_address || '—',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search actions, entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {entityTypes.map(type => (
                <option key={type} value={type || ''}>{type === 'all' ? 'All Types' : type}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Actor</label>
            <select
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {actors.map(actor => (
                <option key={actor} value={actor}>{actor === 'all' ? 'All Actors' : actor}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.profiles?.full_name || 'System'}
                    </div>
                    {log.profiles && (
                      <div className="text-xs text-gray-500 capitalize">{log.profiles.role}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.entity_type && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {log.entity_type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.entity_id ? `#${log.entity_id.slice(0, 8)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <p className="text-gray-900">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Actor</label>
                <p className="text-gray-900">{selectedLog.profiles?.full_name || 'System'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Action</label>
                <p className="text-gray-900">{selectedLog.action}</p>
              </div>
              {selectedLog.changes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Changes</label>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.ip_address && (
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="text-gray-900">{selectedLog.ip_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
