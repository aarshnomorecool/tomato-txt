import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { formatMessageTime } from '../../utils/formatters.js'

export default function ChatMessageList({ messages, currentUserId, loading }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="theme-muted grid h-full place-items-center text-sm">
        Loading messages...
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="theme-muted grid h-full place-items-center px-4 text-center text-sm">
        Start the conversation. Send text, share images, and see updates instantly.
      </div>
    )
  }

  return (
    <div className="space-y-3 px-3 py-4">
      {messages.map((message) => {
        const isMine = message.sender_id === currentUserId

        return (
          <article
            key={message.id}
            className={clsx('flex', {
              'justify-end': isMine,
              'justify-start': !isMine,
            })}
          >
            <div
              className={clsx('max-w-[80%] rounded-2xl px-3 py-2 shadow-sm', {
                'theme-bubble-mine rounded-br-md': isMine,
                'theme-bubble-other rounded-bl-md': !isMine,
              })}
            >
              {message.content ? <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p> : null}

              {message.image_url ? (
                <img
                  src={message.image_url}
                  alt="Shared"
                  className="mt-2 max-h-56 w-full rounded-xl border border-black/10 object-cover"
                />
              ) : null}

              <div
                className={clsx('mt-1.5 flex items-center justify-end gap-1 text-[10px]', {
                  'text-white/75': isMine,
                  'opacity-75': !isMine,
                })}
              >
                <time dateTime={message.created_at}>{formatMessageTime(message.created_at)}</time>
                {isMine ? <span>{message.is_seen ? '✔✔' : '✔'}</span> : null}
              </div>
            </div>
          </article>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
