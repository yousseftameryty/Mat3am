import { requireRole } from '@/utils/auth'
import { redirect } from 'next/navigation'

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole(['admin', 'kitchen'], '/login')

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {children}
    </div>
  )
}
