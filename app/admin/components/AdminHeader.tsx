import { getUserProfile } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { LogOut } from 'lucide-react'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function AdminHeader() {
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-sm text-gray-500">Welcome back, {profile.full_name}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
          <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
