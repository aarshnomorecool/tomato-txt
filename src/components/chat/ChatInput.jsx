import { ImagePlus, SendHorizontal } from 'lucide-react'

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onUploadImage,
  disabled,
  loading,
}) {
  function handleFileUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    onUploadImage(file)
    event.target.value = ''
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="theme-card border-t p-3">
      <div className="flex items-end gap-2">
        <label className="theme-chip inline-flex cursor-pointer items-center justify-center rounded-xl border p-2 transition hover:brightness-110">
          <ImagePlus className="h-4 w-4" />
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={disabled} />
        </label>

        <textarea
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="theme-input max-h-28 min-h-11 flex-1 resize-y rounded-xl border px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="theme-accent inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendHorizontal className="h-4 w-4" />
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
