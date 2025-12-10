import { getUserProfile } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { LogOut } from 'lucide-react'
import LogoutButton from './LogoutButton'

export default async function WaiterHeader() {
  const profile = await getUserProfile()
  
  return (
    <header className="bg-white border-b border-green-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
          <img src="/HKLOGO.png" alt="Hazara Kabab" className="w-7 h-7 object-contain" />
        </div>
        <div>
          <h1 className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
            Hazara Kabab
          </h1>
          <p className="text-xs text-gray-500">Waiter Portal</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
          <p className="text-xs text-gray-500">Table {profile?.role}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
