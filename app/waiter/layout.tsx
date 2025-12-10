import { requireRole } from '@/utils/auth'
import { redirect } from 'next/navigation'
import WaiterHeader from './components/WaiterHeader'

export default async function WaiterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole(['admin', 'waiter'], '/login')

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white">
      <WaiterHeader />
      <main className="pb-20">
        {children}
      </main>
    </div>
  )
}
