import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { pinCode } = await request.json()

    if (!pinCode || typeof pinCode !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN code' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find profile by PIN code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, is_active')
      .eq('pin_code', pinCode)
      .eq('is_active', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN code' },
        { status: 401 }
      )
    }

    // Get the auth user associated with this profile
    // Note: This requires the user to have an auth.users entry
    // For PIN-only login, you might need to create a special auth user
    // or use a different authentication method
    
    // For now, we'll return success and let the client handle the redirect
    // In production, you might want to create a session token or use service role
    
    return NextResponse.json({
      success: true,
      userId: profile.id,
      role: profile.role,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'PIN login failed' },
      { status: 500 }
    )
  }
}
