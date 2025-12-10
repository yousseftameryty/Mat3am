import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole, UserProfile } from './auth-types'

// Re-export types for convenience
export type { UserRole, UserProfile }

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Get the user's profile with role information
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null
  
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error || !profile) {
    return null
  }
  
  return profile as UserProfile
}

/**
 * Get the user's role
 */
export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile()
  return profile?.role || null
}

/**
 * Require a specific role (server-side)
 * Redirects to login if not authenticated
 * Redirects to unauthorized if wrong role
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[],
  redirectTo: string = '/login'
): Promise<UserProfile> {
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect(redirectTo)
  }
  
  if (!profile.is_active) {
    redirect('/login?error=inactive')
  }
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  if (!roles.includes(profile.role)) {
    redirect('/unauthorized')
  }
  
  return profile
}

/**
 * Check if user has permission for an action on a resource
 */
export async function checkPermission(
  action: string,
  resource: string
): Promise<boolean> {
  const profile = await getUserProfile()
  
  if (!profile || !profile.is_active) {
    return false
  }
  
  // Admin has all permissions
  if (profile.role === 'admin') {
    return true
  }
  
  // Define permissions by role
  const permissions: Record<UserRole, Record<string, string[]>> = {
    admin: {
      '*': ['*'] // All permissions
    },
    cashier: {
      orders: ['view', 'create', 'update_paid'],
      order_items: ['view', 'create', 'update_before_cooking'],
      menu_items: ['view']
    },
    waiter: {
      orders: ['view_assigned', 'create_assigned'],
      order_items: ['view_assigned', 'create_assigned'],
      menu_items: ['view']
    },
    kitchen: {
      orders: ['view_pending_cooking', 'update_status'],
      order_items: ['view_pending_cooking', 'update']
    }
  }
  
  const rolePermissions = permissions[profile.role] || {}
  const resourcePermissions = rolePermissions[resource] || []
  
  return resourcePermissions.includes(action) || resourcePermissions.includes('*')
}

