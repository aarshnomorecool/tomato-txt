import { LogOut, Minimize2, Maximize2, UserPlus, Shield } from 'lucide-react'
import TypingIndicator from './TypingIndicator.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function ChatHeader({
  profile,
  selectedUser,
  isPeerTyping,
  isMiniMode,
  onToggleMini,
  onSignOut,
  onOpenFriendPanel,
  onOpenAdminPanel,
  incomingRequestsCount,
}) {
  return (
    <header className="theme-card flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <h2 className="truncate text-lg">
          {selectedUser ? `Chat with ${selectedUser.username}` : 'Select a conversation'}
        </h2>
        <div className="theme-muted mt-1 text-xs">
          Signed in as <span className="font-semibold">{profile?.username || profile?.email}</span>
        </div>
        <TypingIndicator active={isPeerTyping} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Add Friend button */}
        <button
          type="button"
          onClick={onOpenFriendPanel}
          className="relative inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
        >
          <UserPlus className="h-4 w-4" />
          Friends
          {incomingRequestsCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
              {incomingRequestsCount}
            </span>
          )}
        </button>

        {/* Admin Panel button */}
        {onOpenAdminPanel && (
          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40"
          >
            <Shield className="h-4 w-4" />
            Admin
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMini}
          className="theme-chip inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm transition hover:brightness-110"
        >
          {isMiniMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          {isMiniMode ? 'Expand' : 'Mini'}
        </button>

        <ThemeToggle />

        <button
          type="button"
          onClick={onSignOut}
          className="theme-chip inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm transition hover:brightness-110"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  )
}
