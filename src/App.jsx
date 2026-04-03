import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import AuthPage from './pages/AuthPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import PinLockScreen from './components/auth/PinLockScreen.jsx'

function AppRoutes() {
  const { user, profile, loading, pinVerified, verifyPin, signOut } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="theme-card rounded-2xl border px-8 py-6 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Loading your chat workspace...
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="theme-muted text-sm underline transition hover:brightness-125"
          >
            Sign out and start fresh
          </button>
        </div>
      </div>
    )
  }

  // If user is logged in but PIN is not verified (and user has a PIN set), show lock screen
  if (user && profile?.pin_code && !pinVerified) {
    return <PinLockScreen onVerify={verifyPin} profile={profile} />
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/chat" replace />} />
      <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to={user ? '/chat' : '/auth'} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
