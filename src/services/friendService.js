import { supabase } from '../lib/supabaseClient.js'

/**
 * Search profiles by username (partial match), excluding current user.
 */
export async function searchUsers(query, currentUserId) {
  if (!query.trim()) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url')
    .neq('id', currentUserId)
    .ilike('username', `%${query.trim()}%`)
    .order('username', { ascending: true })
    .limit(20)

  if (error) throw error
  return data ?? []
}

/**
 * Send a friend request to a user.
 */
export async function sendFriendRequest(senderId, receiverId) {
  // Check if there's already a pending or accepted request between these users
  const { data: existingList, error: checkError } = await supabase
    .from('friend_requests')
    .select('id, status, sender_id, receiver_id')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .in('status', ['pending', 'accepted'])

  if (checkError) throw checkError

  const existing = existingList?.[0] ?? null

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('You are already friends with this user.')
    }
    if (existing.sender_id === senderId) {
      throw new Error('Friend request already sent.')
    }
    // If the other person already sent us a request, auto-accept it
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return { autoAccepted: true }
  }

  const { error } = await supabase
    .from('friend_requests')
    .insert({ sender_id: senderId, receiver_id: receiverId })

  if (error) throw error
  return { autoAccepted: false }
}

/**
 * Get all pending friend requests received by this user.
 */
export async function fetchIncomingRequests(userId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status, created_at')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Get all pending friend requests sent by this user.
 */
export async function fetchOutgoingRequests(userId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status, created_at')
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Accept a friend request.
 */
export async function acceptFriendRequest(requestId) {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) throw error
}

/**
 * Reject a friend request.
 */
export async function rejectFriendRequest(requestId) {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) throw error
}

/**
 * Get all accepted friends for a user.
 * Returns the profile data of each friend.
 */
export async function fetchFriends(userId) {
  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('sender_id, receiver_id')
    .eq('status', 'accepted')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

  if (error) throw error
  if (!requests || requests.length === 0) return []

  // Extract friend IDs
  const friendIds = requests.map((r) =>
    r.sender_id === userId ? r.receiver_id : r.sender_id
  )

  const uniqueIds = [...new Set(friendIds)]
  if (uniqueIds.length === 0) return []

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url')
    .in('id', uniqueIds)
    .order('username', { ascending: true })

  if (profileError) throw profileError
  return profiles ?? []
}

/**
 * Remove a friend (delete the accepted request).
 */
export async function removeFriend(userId, friendId) {
  // First find the accepted request
  const { data: requests, error: findError } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
    )

  if (findError) throw findError
  if (!requests || requests.length === 0) return

  // Delete each matching request by ID
  for (const req of requests) {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', req.id)

    if (error) throw error
  }
}

/**
 * Subscribe to real-time friend request changes.
 */
export function subscribeToFriendRequests(userId, onInsert, onUpdate) {
  const channel = supabase
    .channel(`friend-requests-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friend_requests',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friend_requests',
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
