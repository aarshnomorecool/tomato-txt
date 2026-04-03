import { MessageCircle, Maximize2, X } from 'lucide-react'
import { MINI_CHAT_HEIGHT, MINI_CHAT_WIDTH } from '../../utils/constants.js'
import ChatMessageList from './ChatMessageList.jsx'
import ChatInput from './ChatInput.jsx'
import TypingIndicator from './TypingIndicator.jsx'

export default function MiniChatWindow({
  visible,
  selectedUser,
  messages,
  currentUserId,
  draft,
  onDraftChange,
  onSend,
  onUploadImage,
  onClose,
  onExpand,
  loadingMessages,
  sending,
  isPeerTyping,
}) {
  if (!visible) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-emerald-500"
        >
          <MessageCircle className="h-4 w-4" />
          Open chat
        </button>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-lg transition hover:bg-stone-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Return to full chat
        </button>
      </div>
    )
  }

  return (
    <section
      className="theme-card fixed bottom-6 right-6 z-40 overflow-hidden rounded-2xl border shadow-2xl"
      style={{ width: MINI_CHAT_WIDTH, height: MINI_CHAT_HEIGHT }}
    >
      <header className="theme-soft mini-chat-handle flex items-center justify-between border-b px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {selectedUser ? selectedUser.username : 'Mini chat'}
            </p>
            <TypingIndicator active={isPeerTyping} />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onExpand}
              className="theme-muted rounded-md p-1 transition hover:bg-white/20"
              aria-label="Expand to full chat"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="theme-muted rounded-md p-1 transition hover:bg-white/20"
              aria-label="Close mini chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
      </header>

      <div className="flex h-[calc(100%-45px)] flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatMessageList messages={messages} currentUserId={currentUserId} loading={loadingMessages} />
        </div>
        <ChatInput
          value={draft}
          onChange={onDraftChange}
          onSubmit={onSend}
          onUploadImage={onUploadImage}
          loading={sending}
          disabled={!selectedUser || sending}
        />
      </div>
    </section>
  )
}
