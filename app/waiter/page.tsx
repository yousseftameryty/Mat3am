import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/auth'
import MyTablesClient from './MyTablesClient'
import AvailableTablesWrapper from './AvailableTablesWrapper'

export default async function WaiterPage() {
  const supabase = await createClient()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  // Get waiter's assigned tables
  const { data: assignments } = await supabase
    .from('waiter_assignments')
    .select(`
      table_id,
      restaurant_tables (
        id,
        status,
        current_order_id,
        orders!restaurant_tables_current_order_id_fkey (
          id,
          status,
          total_price,
          created_at
        )
      )
    `)
    .eq('waiter_id', profile.id)
    .is('unassigned_at', null)

  // Transform the data to match the expected type
  const transformedAssignments = (assignments || []).map((assignment: any) => ({
    table_id: assignment.table_id,
    restaurant_tables: Array.isArray(assignment.restaurant_tables) 
      ? assignment.restaurant_tables[0] 
      : assignment.restaurant_tables
  }))

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">My Tables</h1>
        <p className="text-gray-600 text-sm">Manage your assigned tables</p>
      </div>
      <AvailableTablesWrapper waiterId={profile.id} />
      <MyTablesClient assignments={transformedAssignments} />
    </div>
  )
}
