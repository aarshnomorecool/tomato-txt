import { useMemo, useState } from 'react'
import ConversationList from '../components/chat/ConversationList.jsx'
import ChatHeader from '../components/chat/ChatHeader.jsx'
import ChatInput from '../components/chat/ChatInput.jsx'
import ChatMessageList from '../components/chat/ChatMessageList.jsx'
import MiniChatWindow from '../components/chat/MiniChatWindow.jsx'
import FriendRequestPanel from '../components/chat/FriendRequestPanel.jsx'
import AdminPinPanel from '../components/auth/AdminPinPanel.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useChat } from '../hooks/useChat.js'

export default function ChatPage() {
  const { user, profile, signOut, fetchAllUserPins } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [isMiniMode, setIsMiniMode] = useState(false)
  const [miniVisible, setMiniVisible] = useState(true)
  const [showFriendPanel, setShowFriendPanel] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  const {
    users, // This is now the friends list
    messages,
    loadingMessages,
    sending,
    isPeerTyping,
    onlineUserIds,
    sendTextMessage,
    sendImageMessage,
    notifyTyping,
    // Friend request data
    friends,
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
  } = useChat(user, selectedUserId)

  const activeSelectedUserId = selectedUserId ?? users[0]?.id ?? null
  const activeSelectedUser = users.find((item) => item.id === activeSelectedUserId) ?? null

  const titleLabel = useMemo(() => {
    if (!activeSelectedUser) return 'Choose a friend to begin chatting'
    return `You and ${activeSelectedUser.username}`
  }, [activeSelectedUser])

  async function handleSendMessage() {
    const message = draftMessage
    setDraftMessage('')
    await sendTextMessage(message)
  }

  async function handleUploadImage(file) {
    await sendImageMessage(file)
  }

  function handleInputChange(value) {
    setDraftMessage(value)
    notifyTyping()
  }

  function toggleMiniMode() {
    setIsMiniMode((value) => !value)
    setMiniVisible(true)
  }

  function toggleMiniVisibility() {
    setMiniVisible((value) => !value)
  }

  function handleExpandFromMini() {
    setIsMiniMode(false)
    setMiniVisible(true)
  }

  return (
    <main className="theme-text mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-4 sm:py-5">
      {!isMiniMode ? (
        <section className="theme-soft flex min-h-[84vh] overflow-hidden rounded-3xl border shadow-soft backdrop-blur">
          <aside className="theme-card hidden w-[300px] flex-col border-r p-3 md:flex">
            <h1 className="mb-3 px-2 text-xl">Conversations</h1>
            <ConversationList
              users={users}
              selectedUserId={activeSelectedUserId}
              onSelectUser={(selected) => setSelectedUserId(selected.id)}
              onlineUserIds={onlineUserIds}
              incomingRequestsCount={incomingRequests.length}
              onOpenFriendPanel={() => setShowFriendPanel(true)}
            />
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <ChatHeader
              profile={profile}
              selectedUser={activeSelectedUser}
              isPeerTyping={isPeerTyping}
              isMiniMode={isMiniMode}
              onToggleMini={toggleMiniMode}
              onSignOut={signOut}
              onOpenFriendPanel={() => setShowFriendPanel(true)}
              onOpenAdminPanel={profile?.is_admin ? () => setShowAdminPanel(true) : null}
              incomingRequestsCount={incomingRequests.length}
            />

            <div className="theme-soft theme-muted border-b px-4 py-2 text-xs">
              {titleLabel}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ChatMessageList messages={messages} currentUserId={user?.id} loading={loadingMessages} />
            </div>
            <ChatInput
              value={draftMessage}
              onChange={handleInputChange}
              onSubmit={handleSendMessage}
              onUploadImage={handleUploadImage}
              loading={sending}
              disabled={!activeSelectedUser || sending}
            />
          </section>
        </section>
      ) : null}

      {isMiniMode ? (
        <>
          <MiniChatWindow
            visible={miniVisible}
            selectedUser={activeSelectedUser}
            messages={messages}
            currentUserId={user?.id}
            draft={draftMessage}
            onDraftChange={handleInputChange}
            onSend={handleSendMessage}
            onUploadImage={handleUploadImage}
            onClose={toggleMiniVisibility}
            onExpand={handleExpandFromMini}
            loadingMessages={loadingMessages}
            sending={sending}
            isPeerTyping={isPeerTyping}
          />

          {!miniVisible ? (
            <section className="theme-card mx-auto mt-16 w-full max-w-xl rounded-2xl border px-6 py-6 text-center shadow-soft">
              <h2 className="text-2xl">Mini mode is active</h2>
              <p className="theme-muted mt-2 text-sm">
                Chat is minimized. Use the floating buttons in the bottom-right to reopen or return to full chat.
              </p>
            </section>
          ) : null}
        </>
      ) : null}

      {!isMiniMode ? (
        <section className="mt-3 md:hidden">
          <ConversationList
            users={users}
            selectedUserId={activeSelectedUserId}
            onSelectUser={(selected) => setSelectedUserId(selected.id)}
            onlineUserIds={onlineUserIds}
            incomingRequestsCount={incomingRequests.length}
            onOpenFriendPanel={() => setShowFriendPanel(true)}
          />
        </section>
      ) : null}

      {/* Friend Request Panel Modal */}
      {showFriendPanel && (
        <FriendRequestPanel
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          friendRequestProfiles={friendRequestProfiles}
          searchResults={searchResults}
          searchQuery={searchQuery}
          onSearch={handleSearchUsers}
          onSendRequest={handleSendFriendRequest}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
          friends={friends}
          onRemoveFriend={handleRemoveFriend}
          onClose={() => setShowFriendPanel(false)}
        />
      )}

      {/* Admin PIN Panel Modal */}
      {showAdminPanel && (
        <AdminPinPanel
          onClose={() => setShowAdminPanel(false)}
          fetchAllUserPins={fetchAllUserPins}
        />
      )}
    </main>
  )
}
