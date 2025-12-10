import { createClient } from '@/utils/supabase/server'
import MenuCMSClient from './MenuCMSClient'

export default async function MenuCMSPage() {
  const supabase = await createClient()

  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching menu items:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Menu Management</h1>
        <p className="text-gray-600">Manage menu items, prices, and availability</p>
      </div>
      <MenuCMSClient initialMenuItems={menuItems || []} />
    </div>
  )
}
