'use server'

import { createClient } from '@/utils/supabase/server'

export async function checkProfileStatus(userId: string) {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .single()

  if (error) {
    return { success: false, error: error.message, profile: null }
  }

  return { success: true, profile }
}
