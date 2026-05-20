import { CheckCircle2, XCircle } from 'lucide-react'

export function Notification({ notification }) {
  if (!notification) return null
  const isError = notification.type === 'error'
  return (
    <div
      key={notification.id}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-studio-lg z-[999] animate-fade-in flex items-center gap-2 font-medium text-sm ${isError ? 'bg-red-500 text-white' : 'bg-ink text-white'}`}
    >
      {isError ? <XCircle className="w-5 h-5" strokeWidth={1.8} /> : <CheckCircle2 className="w-5 h-5" strokeWidth={1.8} />}
      {notification.message}
    </div>
  )
}
