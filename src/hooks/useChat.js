import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createPresenceChannel,
  createTypingChannel,
  fetchMessages,
  markConversationAsSeen,
  sendMessage,
  subscribeToMessageInserts,
  uploadChatImage,
} from '../services/chatService.js'
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  subscribeToFriendRequests,
} from '../services/friendService.js'
import { TYPING_DEBOUNCE_MS } from '../utils/constants.js'
import { debounce } from '../utils/debounce.js'
import { getConversationKey } from '../utils/formatters.js'
import { supabase } from '../lib/supabaseClient.js'

export function useChat(currentUser, selectedUserId) {
  const [friends, setFriends] = useState([])
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [isPeerTyping, setIsPeerTyping] = useState(false)
  const [onlineUserIds, setOnlineUserIds] = useState([])

  // Friend request state
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [friendRequestProfiles, setFriendRequestProfiles] = useState({})

  const typingChannelRef = useRef(null)
  const stopTypingTimerRef = useRef(null)

  const currentUserId = currentUser?.id
  const effectiveSelectedUserId = selectedUserId ?? friends[0]?.id ?? null

  const appendMessage = useCallback(
    (message) => {
      if (!currentUserId || !effectiveSelectedUserId) return

      const belongsToConversation =
        (message.sender_id === currentUserId && message.recipient_id === effectiveSelectedUserId) ||
        (message.sender_id === effectiveSelectedUserId && message.recipient_id === currentUserId)

      if (!belongsToConversation) return

      setMessages((previous) => {
        const exists = previous.some((item) => item.id === message.id)
        if (exists) return previous
        return [...previous, message]
      })
    },
    [currentUserId, effectiveSelectedUserId],
  )

  // Fetch friends list
  const refreshFriends = useCallback(async () => {
    if (!currentUserId) return
    setLoadingFriends(true)
    try {
      const nextFriends = await fetchFriends(currentUserId)
      setFriends(nextFriends)
    } catch (err) {
      console.error('Failed to fetch friends:', err)
    } finally {
      setLoadingFriends(false)
    }
  }, [currentUserId])

  // Fetch friend requests
  const refreshRequests = useCallback(async () => {
    if (!currentUserId) return
    try {
      const [incoming, outgoing] = await Promise.all([
        fetchIncomingRequests(currentUserId),
        fetchOutgoingRequests(currentUserId),
      ])
      setIncomingRequests(incoming)
      setOutgoingRequests(outgoing)

      // Fetch profiles for request senders/receivers
      const profileIds = [
        ...incoming.map((r) => r.sender_id),
        ...outgoing.map((r) => r.receiver_id),
      ]
      const uniqueIds = [...new Set(profileIds)]

      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url')
          .in('id', uniqueIds)

        if (profiles) {
          const profileMap = {}
          profiles.forEach((p) => {
            profileMap[p.id] = p
          })
          setFriendRequestProfiles((prev) => ({ ...prev, ...profileMap }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch friend requests:', err)
    }
  }, [currentUserId])

  // Search users
  const handleSearchUsers = useCallback(
    async (query) => {
      setSearchQuery(query)
      if (!currentUserId || !query.trim()) {
        setSearchResults([])
        return
      }
      const results = await searchUsers(query, currentUserId)
      setSearchResults(results)
    },
    [currentUserId],
  )

  // Send friend request
  const handleSendFriendRequest = useCallback(
    async (receiverId) => {
      if (!currentUserId) return
      const result = await sendFriendRequest(currentUserId, receiverId)
      await refreshRequests()
      if (result.autoAccepted) {
        await refreshFriends()
      }
      return result
    },
    [currentUserId, refreshRequests, refreshFriends],
  )

  // Accept friend request
  const handleAcceptRequest = useCallback(
    async (requestId) => {
      await acceptFriendRequest(requestId)
      await Promise.all([refreshRequests(), refreshFriends()])
    },
    [refreshRequests, refreshFriends],
  )

  // Reject friend request
  const handleRejectRequest = useCallback(
    async (requestId) => {
      await rejectFriendRequest(requestId)
      await refreshRequests()
    },
    [refreshRequests],
  )

  // Remove friend
  const handleRemoveFriend = useCallback(
    async (friendId) => {
      if (!currentUserId) return
      await removeFriend(currentUserId, friendId)
      await refreshFriends()
    },
    [currentUserId, refreshFriends],
  )

  // Load friends and requests on mount
  useEffect(() => {
    refreshFriends()
    refreshRequests()
  }, [refreshFriends, refreshRequests])

  // Subscribe to real-time friend request changes
  useEffect(() => {
    if (!currentUserId) return

    const unsubscribe = subscribeToFriendRequests(
      currentUserId,
      () => {
        // New incoming request
        refreshRequests()
      },
      (updated) => {
        // Request was accepted/rejected
        if (updated.status === 'accepted') {
          refreshFriends()
        }
        refreshRequests()
      },
    )

    return unsubscribe
  }, [currentUserId, refreshFriends, refreshRequests])

  // Load messages for selected conversation
  useEffect(() => {
    if (!currentUserId || !effectiveSelectedUserId) {
      setMessages([])
      return
    }

    let isMounted = true

    async function loadMessages() {
      setLoadingMessages(true)
      try {
        const nextMessages = await fetchMessages(currentUserId, effectiveSelectedUserId)
        if (isMounted) {
          setMessages(nextMessages)
          await markConversationAsSeen(currentUserId, effectiveSelectedUserId)
        }
      } finally {
        if (isMounted) {
          setLoadingMessages(false)
        }
      }
    }

    loadMessages()

    return () => {
      isMounted = false
    }
  }, [currentUserId, effectiveSelectedUserId])

  // Subscribe to message inserts
  useEffect(() => {
    if (!currentUserId) return

    const unsubscribe = subscribeToMessageInserts(async (message) => {
      appendMessage(message)

      if (message.recipient_id === currentUserId && message.sender_id === effectiveSelectedUserId) {
        await markConversationAsSeen(currentUserId, effectiveSelectedUserId)
      }
    })

    return unsubscribe
  }, [appendMessage, currentUserId, effectiveSelectedUserId])

  // Typing channel
  useEffect(() => {
    if (!currentUserId || !effectiveSelectedUserId) return undefined

    const key = getConversationKey(currentUserId, effectiveSelectedUserId)
    const channel = createTypingChannel(key, (payload) => {
      if (payload.userId === currentUserId) return

      setIsPeerTyping(Boolean(payload.isTyping))

      if (stopTypingTimerRef.current) {
        clearTimeout(stopTypingTimerRef.current)
      }

      stopTypingTimerRef.current = setTimeout(() => {
        setIsPeerTyping(false)
      }, TYPING_DEBOUNCE_MS)
    })

    typingChannelRef.current = channel

    return () => {
      setIsPeerTyping(false)
      supabase.removeChannel(channel)
    }
  }, [currentUserId, effectiveSelectedUserId])

  // Presence channel
  useEffect(() => {
    if (!currentUserId) return undefined

    const channel = createPresenceChannel(currentUserId, (presenceState) => {
      const ids = Object.values(presenceState)
        .flat()
        .map((entry) => entry.user_id)
        .filter(Boolean)

      setOnlineUserIds(Array.from(new Set(ids)))
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const broadcastTyping = useCallback(
    (isTyping) => {
      if (!typingChannelRef.current || !currentUserId) return

      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          isTyping,
        },
      })
    },
    [currentUserId],
  )

  const debouncedTypingStart = useMemo(() => debounce(() => broadcastTyping(true), 200), [broadcastTyping])
  const debouncedTypingStop = useMemo(
    () => debounce(() => broadcastTyping(false), TYPING_DEBOUNCE_MS),
    [broadcastTyping],
  )

  const notifyTyping = useCallback(() => {
    debouncedTypingStart()
    debouncedTypingStop()
  }, [debouncedTypingStart, debouncedTypingStop])

  const sendTextMessage = useCallback(
    async (text) => {
      if (!currentUserId || !effectiveSelectedUserId || !text.trim()) return

      setSending(true)
      try {
        await sendMessage({
          senderId: currentUserId,
          recipientId: effectiveSelectedUserId,
          content: text,
        })
        broadcastTyping(false)
      } finally {
        setSending(false)
      }
    },
    [broadcastTyping, currentUserId, effectiveSelectedUserId],
  )

  const sendImageMessage = useCallback(
    async (file) => {
      if (!currentUserId || !effectiveSelectedUserId || !file) return

      setSending(true)
      try {
        const imageUrl = await uploadChatImage(file, currentUserId)
        await sendMessage({
          senderId: currentUserId,
          recipientId: effectiveSelectedUserId,
          imageUrl,
          content: '',
        })
      } finally {
        setSending(false)
      }
    },
    [currentUserId, effectiveSelectedUserId],
  )

  return {
    // Chat
    users: friends,
    messages,
    loadingMessages,
    sending,
    isPeerTyping,
    onlineUserIds,
    sendTextMessage,
    sendImageMessage,
    notifyTyping,

    // Friends
    friends,
    loadingFriends,
    refreshFriends,
    incomingRequests,
    outgoingRequests,
    friendRequestProfiles,
    searchResults,
    searchQuery,
    handleSearchUsers,
    handleSendFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
    refreshRequests,
  }
}
