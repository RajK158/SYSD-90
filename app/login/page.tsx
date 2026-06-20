'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

/* ── Shared Icons ── */
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const GithubIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

/* ── Styled input ── */
function AuthInput({
  id, type, value, onChange, placeholder, required, autoComplete,
}: {
  id: string; type: string; value: string
  onChange: (v: string) => void; placeholder: string
  required?: boolean; autoComplete?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      className="w-full text-sm text-[#F0EDED] outline-none transition-colors duration-150"
      style={{ background: '#0C0C0C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '11px 14px' }}
      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,168,56,0.55)')}
      onBlur={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
    />
  )
}

/* ── OAuth button ── */
function OAuthButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 text-sm font-medium text-[#F0EDED] transition-colors duration-150"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2A2A2A', borderRadius: 10, padding: '11px 16px' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = '#3A3A3A' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = '#2A2A2A' }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ═══════════════════════════════════════ Login Page ═══════════════════════════════════════ */
export default function LoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [resetSent, setResetSent]       = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Friendly messages for common Supabase error codes
      const msg =
        error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')
          ? 'Incorrect email or password. Please try again.'
          : error.message
      setError(msg)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above, then click "Forgot password?".')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
      setError(null)
    }
  }

  const handleGoogleLogin = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })

  const handleGithubLogin = () =>
    supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } })

  const canSubmit = !loading && email.length > 0 && password.length > 0

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-4" style={{ background: '#0C0C0C' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,168,56,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full" style={{ maxWidth: '420px' }}>
        {/* Brand */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center font-black text-[#0C0C0C] tracking-tighter" style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #E8A838, #D4761C)', fontSize: 12, boxShadow: '0 2px 12px rgba(232,168,56,0.30)' }}>90</div>
            <span className="font-semibold text-[#F0EDED] tracking-tight" style={{ fontSize: 16, letterSpacing: '-0.01em' }}>Orbit90</span>
          </Link>
          <h1 className="font-semibold text-[#F0EDED] tracking-tight" style={{ fontSize: '1.6rem', lineHeight: 1.1, marginBottom: 8 }}>Welcome back</h1>
          <p className="text-sm text-[#9A9494]">Continue your 90-day engineering journey</p>
        </div>

        {/* Card */}
        <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: 16, padding: 32 }}>

          {/* ── Email / Password form FIRST ── */}
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>

            {error && (
              <div className="text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 10, padding: '11px 14px', color: '#f87171' }}>
                {error}
              </div>
            )}

            {resetSent && (
              <div className="text-sm" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)', borderRadius: 10, padding: '11px 14px', color: '#34d399' }}>
                Password reset link sent — check your inbox.
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="li-email" className="block text-xs font-semibold tracking-wider uppercase text-[#9A9494]" style={{ marginBottom: 7 }}>Email</label>
              <AuthInput id="li-email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required autoComplete="email" />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                <label htmlFor="li-pw" className="block text-xs font-semibold tracking-wider uppercase text-[#9A9494]">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium transition-colors"
                  style={{ color: '#5C5757' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#E8A838')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5C5757')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <AuthInput id="li-pw" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5757] hover:text-[#9A9494] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full font-semibold text-sm transition-all duration-200"
              style={{
                background: canSubmit ? 'linear-gradient(135deg, #E8A838, #D4761C)' : '#2A2A2A',
                color: canSubmit ? '#0C0C0C' : '#5C5757',
                borderRadius: 10,
                padding: '12px 16px',
                marginTop: 2,
                boxShadow: canSubmit ? '0 4px 18px rgba(232,168,56,0.22)' : 'none',
                outline: 'none',
                border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#1F1F1F' }} />
            <span className="text-xs font-mono text-[#5C5757] tracking-wider">OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: 1, background: '#1F1F1F' }} />
          </div>

          {/* ── OAuth ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OAuthButton onClick={handleGoogleLogin} icon={<GoogleIcon />} label="Google" />
            <OAuthButton onClick={handleGithubLogin} icon={<GithubIcon />} label="GitHub" />
          </div>

          <p className="text-center text-xs text-[#5C5757]" style={{ marginTop: 24 }}>
            No account?{' '}
            <Link href="/signup" className="font-semibold transition-colors" style={{ color: '#E8A838' }}>Begin your 90-day protocol</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
