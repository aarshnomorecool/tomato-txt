import { supabase } from '../lib/supabaseClient.js'
import { MAX_IMAGE_SIZE_MB } from '../utils/constants.js'

export async function fetchMessages(currentUserId, selectedUserId) {
  if (!selectedUserId) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${currentUserId},recipient_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},recipient_id.eq.${currentUserId})`,
    )
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function sendMessage({ senderId, recipientId, content, imageUrl = null }) {
  const payload = {
    sender_id: senderId,
    recipient_id: recipientId,
    content: content?.trim() ? content.trim() : null,
    image_url: imageUrl,
  }

  const { data, error } = await supabase.from('messages').insert(payload).select('*').single()

  if (error) throw error
  return data
}

export async function markConversationAsSeen(currentUserId, selectedUserId) {
  const { error } = await supabase
    .from('messages')
    .update({ is_seen: true })
    .eq('recipient_id', currentUserId)
    .eq('sender_id', selectedUserId)
    .eq('is_seen', false)

  if (error) throw error
}

export async function uploadChatImage(file, userId) {
  if (!file) throw new Error('No file selected.')

  const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`Image is too large. Max file size is ${MAX_IMAGE_SIZE_MB}MB.`)
  }

  const extension = file.name.split('.').pop()
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath)
  return data.publicUrl
}

export function subscribeToMessageInserts(onInsert) {
  const channel = supabase
    .channel(`messages-inserts-${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        onInsert(payload.new)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function createTypingChannel(key, onTyping) {
  const channel = supabase
    .channel(`typing-${key}`, {
      config: {
        broadcast: { self: true },
        presence: { key },
      },
    })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      onTyping(payload)
    })
    .subscribe()

  return channel
}

export function createPresenceChannel(currentUserId, onSync) {
  const channel = supabase
    .channel('chat-presence', {
      config: {
        presence: { key: currentUserId },
      },
    })
    .on('presence', { event: 'sync' }, () => {
      onSync(channel.presenceState())
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        })
      }
    })

  return channel
}
