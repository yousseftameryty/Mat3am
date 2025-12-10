import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireRole } from '@/utils/auth'

export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('admin', '/login')

    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const role = formData.get('role') as string
    const pinCode = formData.get('pin_code') as string | null

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use Supabase Admin API to create user
    // Note: This requires SUPABASE_SERVICE_ROLE_KEY in environment variables
    const supabaseAdmin = await createClient()
    
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: role,
        pin_code: pinCode ? parseInt(pinCode) : null,
        is_active: true,
      })
      .select()
      .single()

    if (profileError || !profile) {
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, error: profileError?.message || 'Failed to create profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create staff member' },
      { status: 500 }
    )
  }
}
