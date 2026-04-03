import clsx from 'clsx'
import { UserPlus } from 'lucide-react'

export default function ConversationList({
  users,
  selectedUserId,
  onSelectUser,
  onlineUserIds,
  incomingRequestsCount,
  onOpenFriendPanel,
}) {
  return (
    <>
      {/* Add Friends button at top of sidebar */}
      <button
        type="button"
        onClick={onOpenFriendPanel}
        className="theme-chip relative mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition hover:brightness-110"
      >
        <UserPlus className="h-4 w-4" />
        Add Friends
        {incomingRequestsCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {incomingRequestsCount}
          </span>
        )}
      </button>

      {users.length === 0 ? (
        <div className="theme-card theme-muted rounded-2xl border border-dashed p-5 text-center text-sm">
          No friends yet. Click "Add Friends" above to search and add people!
        </div>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => {
            const isSelected = user.id === selectedUserId
            const isOnline = onlineUserIds.includes(user.id)

            return (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => onSelectUser(user)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition',
                    isSelected
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                      : 'bg-white/60 text-stone-700 hover:bg-stone-100 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800',
                  )}
                >
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`}
                    alt={user.username}
                    className="h-10 w-10 rounded-xl border border-stone-300 object-cover dark:border-slate-700"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{user.username}</span>
                    <span className="block truncate text-xs opacity-70">{user.email}</span>
                  </span>
                  <span
                    className={clsx(
                      'h-2.5 w-2.5 rounded-full',
                      isOnline ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.2)]' : 'bg-stone-300 dark:bg-slate-600',
                    )}
                    title={isOnline ? 'Online' : 'Offline'}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
