import { useState } from 'react'
import { UserPlus, Search, Check, X, Clock, UserMinus, Users } from 'lucide-react'

export default function FriendRequestPanel({
  incomingRequests,
  outgoingRequests,
  friendRequestProfiles,
  searchResults,
  searchQuery,
  onSearch,
  onSendRequest,
  onAccept,
  onReject,
  friends,
  onRemoveFriend,
  onClose,
}) {
  const [tab, setTab] = useState('search')
  const [sending, setSending] = useState({})
  const [accepting, setAccepting] = useState({})
  const [rejecting, setRejecting] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSend(userId) {
    setSending((prev) => ({ ...prev, [userId]: true }))
    setError('')
    setSuccess('')
    try {
      const result = await onSendRequest(userId)
      if (result?.autoAccepted) {
        setSuccess('You are now friends! (They had already sent you a request)')
      } else {
        setSuccess('Friend request sent!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSending((prev) => ({ ...prev, [userId]: false }))
    }
  }

  async function handleAccept(requestId) {
    setAccepting((prev) => ({ ...prev, [requestId]: true }))
    try {
      await onAccept(requestId)
      setSuccess('Friend request accepted!')
    } catch (err) {
      setError(err.message)
    } finally {
      setAccepting((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  async function handleReject(requestId) {
    setRejecting((prev) => ({ ...prev, [requestId]: true }))
    try {
      await onReject(requestId)
    } catch (err) {
      setError(err.message)
    } finally {
      setRejecting((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  // Check if a user is already a friend
  function isFriend(userId) {
    return friends.some((f) => f.id === userId)
  }

  // Check if there's already a pending request
  function hasPendingRequest(userId) {
    return outgoingRequests.some((r) => r.receiver_id === userId) ||
           incomingRequests.some((r) => r.sender_id === userId)
  }

  const tabs = [
    { key: 'search', label: 'Find People', icon: Search },
    { key: 'incoming', label: `Incoming (${incomingRequests.length})`, icon: UserPlus },
    { key: 'outgoing', label: `Sent (${outgoingRequests.length})`, icon: Clock },
    { key: 'friends', label: `Friends (${friends.length})`, icon: Users },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-300/70 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 dark:border-slate-700 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-serif text-lg text-stone-900 dark:text-stone-100">
              Friends & Requests
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-200 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 dark:border-slate-700 dark:bg-slate-800/50">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => {
                setTab(tabItem.key)
                setError('')
                setSuccess('')
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition ${
                tab === tabItem.key
                  ? 'border-b-2 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'text-stone-500 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tabItem.icon className="h-3.5 w-3.5" />
              {tabItem.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {success}
            </div>
          )}

          {/* Search Tab */}
          {tab === 'search' && (
            <>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-9 pr-4 text-sm text-stone-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {searchQuery && searchResults.length === 0 && (
                  <p className="py-4 text-center text-sm text-stone-500 dark:text-slate-400">
                    No users found matching "{searchQuery}"
                  </p>
                )}
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`}
                      alt={user.username}
                      className="h-10 w-10 rounded-xl border border-stone-300 object-cover dark:border-slate-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800 dark:text-slate-100">
                        {user.username}
                      </p>
                      <p className="truncate text-xs text-stone-500 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                    {isFriend(user.id) ? (
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Friends
                      </span>
                    ) : hasPendingRequest(user.id) ? (
                      <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Pending
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSend(user.id)}
                        disabled={sending[user.id]}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {sending[user.id] ? '...' : 'Add'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Incoming Tab */}
          {tab === 'incoming' && (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {incomingRequests.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500 dark:text-slate-400">
                  No pending friend requests.
                </p>
              ) : (
                incomingRequests.map((req) => {
                  const sender = friendRequestProfiles[req.sender_id]
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <img
                        src={sender?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${sender?.username || '?'}`}
                        alt={sender?.username || 'User'}
                        className="h-10 w-10 rounded-xl border border-stone-300 object-cover dark:border-slate-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800 dark:text-slate-100">
                          {sender?.username || 'Unknown user'}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-slate-400">
                          Wants to be friends
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAccept(req.id)}
                          disabled={accepting[req.id]}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {accepting[req.id] ? '...' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(req.id)}
                          disabled={rejecting[req.id]}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                          {rejecting[req.id] ? '...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Outgoing Tab */}
          {tab === 'outgoing' && (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {outgoingRequests.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500 dark:text-slate-400">
                  No pending sent requests.
                </p>
              ) : (
                outgoingRequests.map((req) => {
                  const receiver = friendRequestProfiles[req.receiver_id]
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <img
                        src={receiver?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${receiver?.username || '?'}`}
                        alt={receiver?.username || 'User'}
                        className="h-10 w-10 rounded-xl border border-stone-300 object-cover dark:border-slate-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800 dark:text-slate-100">
                          {receiver?.username || 'Unknown user'}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-slate-400">
                          <Clock className="mr-1 inline h-3 w-3" />
                          Pending...
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Friends List Tab */}
          {tab === 'friends' && (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500 dark:text-slate-400">
                  No friends yet. Search for people to add!
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <img
                      src={friend.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${friend.username}`}
                      alt={friend.username}
                      className="h-10 w-10 rounded-xl border border-stone-300 object-cover dark:border-slate-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800 dark:text-slate-100">
                        {friend.username}
                      </p>
                      <p className="truncate text-xs text-stone-500 dark:text-slate-400">
                        {friend.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove ${friend.username} from friends?`)) {
                          onRemoveFriend(friend.id)
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
