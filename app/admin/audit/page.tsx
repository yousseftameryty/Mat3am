import { createClient } from '@/utils/supabase/server'
import AuditLogViewer from './AuditLogViewer'

export default async function AuditLogPage() {
  const supabase = await createClient()

  const { data: auditLogs, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profiles!audit_logs_actor_id_fkey (
        full_name,
        role
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching audit logs:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Audit Logs</h1>
        <p className="text-gray-600">Complete activity log of all system actions</p>
      </div>
      <AuditLogViewer initialLogs={auditLogs || []} />
    </div>
  )
}
