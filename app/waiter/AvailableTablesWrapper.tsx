'use client'

import { useRouter } from 'next/navigation'
import AvailableTables from './components/AvailableTables'

interface AvailableTablesWrapperProps {
  waiterId: string
}

export default function AvailableTablesWrapper({ waiterId }: AvailableTablesWrapperProps) {
  const router = useRouter()

  const handleAssign = () => {
    router.refresh()
  }

  return <AvailableTables waiterId={waiterId} onAssign={handleAssign} />
}
