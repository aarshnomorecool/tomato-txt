import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard.jsx'
import ThemeToggle from '../components/chat/ThemeToggle.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function AuthPage() {
  const navigate = useNavigate()
  const { signInWithEmail, signInWithUsername, signUpWithEmail } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleAction(action) {
    setLoading(true)
    try {
      await action()
      navigate('/chat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <AuthCard
        loading={loading}
        onEmailLogin={(payload) => handleAction(() => signInWithEmail(payload))}
        onUsernameLogin={(payload) => handleAction(() => signInWithUsername(payload))}
        onSignup={(payload) => handleAction(() => signUpWithEmail(payload))}
      />
    </main>
  )
}
