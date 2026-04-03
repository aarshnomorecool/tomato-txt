export function formatMessageTime(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getConversationKey(userA, userB) {
  return [userA, userB].sort().join(':')
}
