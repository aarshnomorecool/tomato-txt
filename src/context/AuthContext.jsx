import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  getCurrentSession,
  getProfileById,
  signInWithEmail,
  signInWithUsername,
  signOut,
  signUpWithEmail,
  verifyPin,
  updatePin,
  fetchAllUserPins,
} from '../services/authService.js'
import { supabase } from '../lib/supabaseClient.js'
import { AuthContext } from './auth-context.js'

const PIN_VERIFIED_KEY = 'tomato-pin-verified'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pinVerified, setPinVerified] = useState(false)

  async function hydrateSession() {
    try {
      // Race the entire hydration against a 5s timeout
      await Promise.race([
        (async () => {
          const session = await getCurrentSession()
          const nextUser = session?.user ?? null
          setUser(nextUser)

          if (nextUser) {
            try {
              const nextProfile = await getProfileById(nextUser.id)
              setProfile(nextProfile)

              const sessionPinVerified = sessionStorage.getItem(PIN_VERIFIED_KEY)
              if (sessionPinVerified === nextUser.id) {
                setPinVerified(true)
              }
            } catch (profileError) {
              console.error('Error fetching profile during hydration:', profileError)
              setProfile(null)
            }
          }
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session hydration timed out')), 5000)
        ),
      ])
    } catch (error) {
      console.error('Session hydration failed:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    hydrateSession()

    // Safety timeout: never stay stuck on loading longer than 10s
    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn('Loading timed out — forcing app to render')
        return false
      })
    }, 10000)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        try {
          const nextProfile = await getProfileById(nextUser.id)
          setProfile(nextProfile)
        } catch (profileError) {
          console.error('Error fetching profile on state change:', profileError)
          setProfile(null)
        }
      } else {
        setProfile(null)
        setPinVerified(false)
        sessionStorage.removeItem(PIN_VERIFIED_KEY)
      }

      setLoading(false)
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  const handleVerifyPin = useCallback(
    async (pin) => {
      if (!user) throw new Error('Not logged in')
      const valid = await verifyPin(user.id, pin)
      if (valid) {
        setPinVerified(true)
        sessionStorage.setItem(PIN_VERIFIED_KEY, user.id)
      }
      return valid
    },
    [user],
  )

  const handleUpdatePin = useCallback(
    async (newPin) => {
      if (!user) throw new Error('Not logged in')
      await updatePin(user.id, newPin)
      const nextProfile = await getProfileById(user.id)
      setProfile(nextProfile)
    },
    [user],
  )

  const handleSignOut = useCallback(async () => {
    await signOut()
    setPinVerified(false)
    sessionStorage.removeItem(PIN_VERIFIED_KEY)
  }, [])

  const handleRefreshProfile = useCallback(async () => {
    if (!user) return
    try {
      const nextProfile = await getProfileById(user.id)
      setProfile(nextProfile)
    } catch (e) {
      console.error('Failed to refresh profile:', e)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      pinVerified,
      signUpWithEmail,
      signInWithEmail,
      signInWithUsername,
      signOut: handleSignOut,
      verifyPin: handleVerifyPin,
      updatePin: handleUpdatePin,
      fetchAllUserPins,
      refreshProfile: handleRefreshProfile,
    }),
    [loading, profile, user, pinVerified, handleVerifyPin, handleUpdatePin, handleSignOut, handleRefreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
