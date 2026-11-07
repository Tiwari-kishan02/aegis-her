import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestOtp = async (event) => {
    event.preventEvent?.()
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api('/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) })
      setStep('otp')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) })
      localStorage.setItem('aegis_token', result.access_token)
      navigate('/contacts')
    } catch (verifyError) {
      setError(verifyError.message)
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
        <p className="mt-1 text-sm text-slate-600">Use your phone number to enable trusted contact alerts.</p>

        {step === 'phone' ? (
          <form onSubmit={requestOtp} className="mt-6">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="phone">Phone number</label>
            <input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit Indian number" className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-aegis" />
            {error && <p className="mt-3 text-sm text-sos">{error}</p>}
            <button type="submit" disabled={!phone.trim() || loading} className="mt-4 h-12 w-full rounded-lg bg-aegis font-bold text-white disabled:bg-slate-300">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="otp">6-digit OTP</label>
            <input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-3 text-center text-xl tracking-widest outline-none focus:border-aegis" />
            {error && <p className="mt-3 text-sm text-sos">{error}</p>}
            <button type="submit" disabled={otp.length !== 6 || loading} className="mt-4 h-12 w-full rounded-lg bg-aegis font-bold text-white disabled:bg-slate-300">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError('') }} className="mt-3 text-sm font-semibold text-aegis">Change phone number</button>
          </form>
        )}
      </section>
    </main>
  )
}
