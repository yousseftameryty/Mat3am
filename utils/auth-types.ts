// Shared types and utilities that can be used in both client and server components

export type UserRole = 'admin' | 'cashier' | 'waiter' | 'kitchen'

export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  pin_code: number | null
  is_active: boolean
}

/**
 * Get redirect path based on user role
 * This is a pure function that can be used in client components
 */
export function getRoleRedirectPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin: '/admin',
    cashier: '/cashier',
    waiter: '/waiter',
    kitchen: '/kitchen'
  }
  
  return paths[role] || '/login'
}
