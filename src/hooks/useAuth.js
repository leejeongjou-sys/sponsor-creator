import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { getFirebase } from '../lib/firebase'

export const useAuth = () => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const { auth } = getFirebase()
    if (!auth) return
    let cancelled = false
    const safeSet = (u) => { if (!cancelled) setUser(u) }

    const init = async () => {
      if (auth.currentUser) return safeSet(auth.currentUser)
      try {
        const cred = await signInAnonymously(auth)
        safeSet(cred.user)
      } catch (e) {
        console.error(e)
      }
    }
    init()
    const unsub = onAuthStateChanged(auth, safeSet)
    return () => { cancelled = true; unsub() }
  }, [])

  return user
}
