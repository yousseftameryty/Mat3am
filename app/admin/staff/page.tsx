import { createClient } from '@/utils/supabase/server'
import StaffManagementClient from './StaffManagementClient'

export default async function StaffManagementPage() {
  const supabase = await createClient()

  // Fetch all staff
  const { data: staff, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching staff:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Staff Management</h1>
        <p className="text-gray-600">Manage employee accounts and permissions</p>
      </div>
      <StaffManagementClient initialStaff={staff || []} />
    </div>
  )
}
