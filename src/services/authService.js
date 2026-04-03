import { supabase } from '../lib/supabaseClient.js'

function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

export async function signUpWithEmail({ email, password, username, pinCode }) {
  const normalizedUsername = normalizeUsername(username)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: normalizedUsername, pin_code: pinCode },
    },
  })

  if (error) throw error

  // Also update the profile directly in case the trigger doesn't set it
  if (data?.user?.id) {
    const { error: pinUpdateError } = await supabase
      .from('profiles')
      .update({ pin_code: pinCode })
      .eq('id', data.user.id)

    if (pinUpdateError) {
      console.warn('PIN update after signup failed, trigger may still sync profile:', pinUpdateError)
    }
  }

  return data
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithUsername({ username, password }) {
  const normalizedUsername = normalizeUsername(username)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', normalizedUsername)
    .single()

  if (profileError || !profile?.email) {
    throw new Error('Username not found. Double-check and try again.')
  }

  return signInWithEmail({ email: profile.email, password })
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getProfileById(userId) {
  // Use select('*') to avoid errors if new columns haven't been added yet
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  return {
    id: data.id,
    username: data.username,
    email: data.email,
    avatar_url: data.avatar_url,
    pin_code: data.pin_code ?? null,
    is_admin: data.is_admin ?? false,
  }
}

export async function verifyPin(userId, pin) {
  const { data, error } = await supabase
    .from('profiles')
    .select('pin_code')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data?.pin_code === pin
}

export async function updatePin(userId, newPin) {
  const { error } = await supabase
    .from('profiles')
    .update({ pin_code: newPin })
    .eq('id', userId)

  if (error) throw error
}

// Admin only: fetch all users with their PINs
export async function fetchAllUserPins() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error('Not authenticated.')

  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError
  if (!currentProfile?.is_admin) {
    throw new Error('Only admins can view user PINs.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email, pin_code')
    .order('username', { ascending: true })

  if (error) throw error
  return data ?? []
}
