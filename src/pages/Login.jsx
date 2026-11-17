import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProfile, signInWithOtp, verifyOtp } from '../services/supabase'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_SECONDS = 60

function getAuthErrorMessage(error, isVerification = false) {
  const message = error?.message || ''
  const code = error?.code || ''

  if (
    error?.status === 429 ||
    /rate.?limit|too many requests|security purposes|over_email_send_rate_limit/i.test(`${code} ${message}`)
  ) {
    return 'Too many requests, please wait and try again'
  }

  if (
    isVerification &&
    /(?:token|otp|code|email link).*(?:invalid|expired)|(?:invalid|expired).*(?:token|otp|code|email link)|(?:otp|token)_expired/i.test(
      `${code} ${message}`,
    )
  ) {
    return 'Wrong or expired code'
  }

  return message || 'Something went wrong. Please try again.'
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (resendCountdown === 0) return undefined

    const timer = window.setTimeout(() => {
      setResendCountdown((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendCountdown])

  const requestOtp = async (event) => {
    event?.preventDefault()
    if (loading || resendCountdown > 0) return

    const normalizedEmail = email.trim()
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await signInWithOtp(normalizedEmail)
      setEmail(normalizedEmail)
      setOtp('')
      setStep('otp')
      setResendCountdown(RESEND_COOLDOWN_SECONDS)
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  const verifyOtpCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await verifyOtp({ email, token: otp })
      if (result.session) {
        setStep('profile')
      }
    } catch (verifyError) {
      setError(getAuthErrorMessage(verifyError, true))
    } finally {
      setLoading(false)
    }
  }

  const completeProfile = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await saveProfile({ name, phone })
      navigate('/contacts')
    } catch (profileError) {
      setError(profileError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-bg px-5 py-4">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 flex h-11 items-center gap-2 font-semibold text-aegis">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
      </button>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-aegis">Login</h1>
        <p className="mt-1 text-sm text-slate-600">Use your email to unlock Aegis alerts and trusted contacts.</p>

        {step === 'email' && (
          <form onSubmit={requestOtp} className="mt-6">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-aegis" required />
            {resendCountdown > 0 && <p className="mt-2 text-sm text-slate-600">You can request another code in {resendCountdown}s.</p>}
            {error && <p className="mt-3 text-sm text-sos">{error}</p>}
            <button type="submit" disabled={!email.trim() || loading || resendCountdown > 0} className="mt-4 h-12 w-full rounded-lg bg-aegis font-bold text-white disabled:bg-slate-300">
              {loading ? 'Sending...' : resendCountdown > 0 ? `Send OTP in ${resendCountdown}s` : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtpCode} className="mt-6">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="otp">6-digit OTP</label>
            <input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 text-center text-xl tracking-widest outline-none focus:border-aegis" />
            <p className="mt-2 text-sm text-slate-600">Check your spam folder.</p>
            {error && <p className="mt-3 text-sm text-sos">{error}</p>}
            <button type="submit" disabled={otp.length !== 6 || loading} className="mt-4 h-12 w-full rounded-lg bg-aegis font-bold text-white disabled:bg-slate-300">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={requestOtp} disabled={loading || resendCountdown > 0} className="mt-3 text-sm font-semibold text-aegis disabled:text-slate-400">
              {loading ? 'Sending...' : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setOtp(''); setError('') }} className="mt-3 text-sm font-semibold text-aegis">Change email</button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={completeProfile} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="name">Name</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-aegis" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="phone">Phone</label>
              <input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit Indian phone" className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-aegis" required />
            </div>
            {error && <p className="text-sm text-sos">{error}</p>}
            <button type="submit" disabled={!name.trim() || !phone.trim() || loading} className="h-12 w-full rounded-lg bg-aegis font-bold text-white disabled:bg-slate-300">
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
