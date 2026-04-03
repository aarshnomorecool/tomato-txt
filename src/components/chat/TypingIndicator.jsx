export default function TypingIndicator({ active }) {
  if (!active) return null

  return (
    <div className="animate-pulse text-xs font-medium text-emerald-600 dark:text-emerald-400">
      Typing...
    </div>
  )
}
