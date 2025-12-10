'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getRoleRedirectPath } from '@/utils/auth-types'
import { motion } from 'framer-motion'
import { LogIn, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<'email' | 'pin'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single()

        if (!profile || !profile.is_active) {
          setError('Account is inactive. Please contact administrator.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Redirect based on role
        const redirectPath = getRoleRedirectPath(profile.role as any)
        router.push(redirectPath)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      setLoading(false)
    }
  }

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Find profile by PIN code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, is_active, pin_code')
        .eq('pin_code', parseInt(pinCode))
        .eq('is_active', true)
        .single()

      if (profileError || !profile) {
        setError('Invalid PIN code')
        setLoading(false)
        return
      }

      // For PIN login, we need to use service role or create a session
      // Since we can't use service role from client, we'll need a server action
      // For now, redirect to a server action endpoint
      const response = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode: parseInt(pinCode) }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'PIN login failed')
        setLoading(false)
        return
      }

      // Refresh and redirect
      const redirectPath = getRoleRedirectPath(profile.role as any)
      router.push(redirectPath)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred during PIN login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-green-100 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-green-500/30">
              <img src="/HKLOGO.png" alt="Hazara Kabab" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Hazara Kabab
            </h1>
            <p className="text-gray-600 text-sm">Employee Portal</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-green-50 rounded-xl">
            <button
              onClick={() => {
                setLoginMethod('email')
                setError(null)
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={16} />
                Email
              </div>
            </button>
            <button
              onClick={() => {
                setLoginMethod('pin')
                setError(null)
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginMethod === 'pin'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Lock size={16} />
                PIN Code
              </div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="employee@hazarakabab.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* PIN Login Form */}
          {loginMethod === 'pin' && (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Code
                </label>
                <input
                  id="pinCode"
                  type="number"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  placeholder="0000"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter your 4-6 digit PIN code
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={20} />
                    Quick Login
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
