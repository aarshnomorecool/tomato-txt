import { useRef, useState } from 'react'
import { MessageSquareText, Eye, EyeOff } from 'lucide-react'

const initialForm = {
  username: '',
  email: '',
  password: '',
  pin: ['', '', '', ''],
}

export default function AuthCard({ onEmailLogin, onUsernameLogin, onSignup, loading }) {
  const [mode, setMode] = useState('login')
  const [loginMethod, setLoginMethod] = useState('email')
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPin, setShowPin] = useState(false)
  const pinRefs = useRef([])

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  function handlePinChange(index, value) {
    if (!/^\d?$/.test(value)) return
    const nextPin = [...form.pin]
    nextPin[index] = value
    setForm((prev) => ({ ...prev, pin: nextPin }))

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus()
    }
  }

  function handlePinKeyDown(index, event) {
    if (event.key === 'Backspace' && !form.pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus()
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        const pinCode = form.pin.join('')
        if (pinCode.length !== 4) {
          setError('Please set a 4-digit PIN to protect your account.')
          return
        }

        await onSignup({
          username: form.username,
          email: form.email,
          password: form.password,
          pinCode,
        })

        setSuccess('Account created with PIN protection! You can now chat in real time!')
        return
      }

      if (loginMethod === 'email') {
        await onEmailLogin({ email: form.email, password: form.password })
      } else {
        await onUsernameLogin({ username: form.username, password: form.password })
      }
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="theme-card w-full max-w-md overflow-hidden rounded-3xl border p-8 shadow-soft backdrop-blur">
      <div className="mb-8 text-center">
        <div className="theme-accent mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
          <MessageSquareText className="h-6 w-6" />
        </div>
        <h1 className="text-3xl">Tomato Chat</h1>
        <p className="theme-muted mt-2 text-sm">
          Real-time messaging with PIN protection, friend requests, and mini player mode.
        </p>
      </div>

      <div className="mb-6 flex rounded-xl bg-stone-200/70 p-1 dark:bg-slate-800/70">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === 'login'
              ? 'bg-white text-stone-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
              : 'text-stone-600 dark:text-slate-300'
          }`}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === 'signup'
              ? 'bg-white text-stone-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
              : 'text-stone-600 dark:text-slate-300'
          }`}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>

      {mode === 'login' && (
        <div className="mb-4 flex rounded-xl bg-stone-200/70 p-1 dark:bg-slate-800/70">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition ${
              loginMethod === 'email'
                ? 'bg-white text-stone-900 dark:bg-slate-700 dark:text-slate-100'
                : 'text-stone-600 dark:text-slate-300'
            }`}
          >
            Email login
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('username')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition ${
              loginMethod === 'username'
                ? 'bg-white text-stone-900 dark:bg-slate-700 dark:text-slate-100'
                : 'text-stone-600 dark:text-slate-300'
            }`}
          >
            Username login
          </button>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {(mode === 'signup' || loginMethod === 'username') && (
          <label className="block text-sm text-stone-700 dark:text-slate-200">
            Username
            <input
              type="text"
              required
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="yourname"
            />
          </label>
        )}

        {(mode === 'signup' || loginMethod === 'email') && (
          <label className="block text-sm text-stone-700 dark:text-slate-200">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="you@example.com"
            />
          </label>
        )}

        <label className="block text-sm text-stone-700 dark:text-slate-200">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="At least 6 characters"
          />
        </label>

        {/* PIN Setup - only during signup */}
        {mode === 'signup' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200">
              Set a 4-digit PIN
              <span className="ml-1 text-xs font-normal text-stone-400 dark:text-slate-500">
                (Required — used to lock the app)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {form.pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (pinRefs.current[i] = el)}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="h-11 w-11 rounded-xl border-2 border-stone-300 bg-white text-center text-lg font-bold text-stone-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-400"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="rounded-lg p-2 text-stone-400 transition hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {error ? <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="theme-accent w-full rounded-xl px-4 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
