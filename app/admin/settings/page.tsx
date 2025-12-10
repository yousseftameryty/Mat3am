import { getUserProfile } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { Settings, User, Bell, Shield, Database, Globe } from 'lucide-react'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const profile = await getUserProfile()

  // Get restaurant settings/info
  const { data: restaurantInfo } = await supabase
    .from('profiles')
    .select('count(*)')
    .limit(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage system configuration and preferences</p>
      </div>

      <SettingsClient profile={profile} />
    </div>
  )
}
