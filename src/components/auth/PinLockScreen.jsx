import { useRef, useState } from 'react'
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'

export default function PinLockScreen({ onVerify, profile }) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const inputRefs = useRef([])

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return

    const nextPin = [...pin]
    nextPin[index] = value
    setPin(nextPin)
    setError('')

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      const newPin = pasted.split('')
      setPin(newPin)
      inputRefs.current[3]?.focus()
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const fullPin = pin.join('')
    if (fullPin.length !== 4) {
      setError('Please enter all 4 digits')
      return
    }

    setLoading(true)
    try {
      const valid = await onVerify(fullPin)
      if (!valid) {
        setError('Incorrect PIN. Try again.')
        setPin(['', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('Something went wrong. Try again.')
      setPin(['', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-stone-300/70 bg-white/85 p-8 shadow-soft backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
            App Locked
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-slate-300">
            Welcome back, <span className="font-semibold">{profile?.username}</span>. Enter your 4-digit PIN to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-3">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="h-14 w-14 rounded-xl border-2 border-stone-300 bg-white text-center text-2xl font-bold text-stone-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-amber-400"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 transition hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPin ? 'Hide PIN' : 'Show PIN'}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-100 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.some((d) => !d)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck className="h-5 w-5" />
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-400 dark:text-slate-500">
          Forgot your PIN? Contact the admin to recover it.
        </p>
      </div>
    </main>
  )
}
