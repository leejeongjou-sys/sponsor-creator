import { useCallback, useRef, useState } from 'react'

export const useNotification = () => {
  const [notification, setNotification] = useState(null)
  const timeoutRef = useRef(null)

  const notify = useCallback((message, type = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setNotification({ message, type, id: Date.now() })
    timeoutRef.current = setTimeout(() => setNotification(null), 3000)
  }, [])

  return { notification, notify }
}
