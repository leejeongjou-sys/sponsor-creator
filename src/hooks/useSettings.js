import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getAppId, getFirebase } from '../lib/firebase'

const STORAGE_KEY = 'sponsor_creator_settings'
const DEFAULT = { apiKey: '' }

export const useSettings = (user) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...DEFAULT, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch {}
  }, [settings])

  useEffect(() => {
    if (!user?.uid) return
    const { db } = getFirebase()
    if (!db) return
    const ref = doc(db, 'artifacts', getAppId(), 'users', user.uid, 'preferences', 'general')
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setSettings((prev) => ({ ...prev, ...snap.data() }))
    })
  }, [user?.uid])

  const update = async (next) => {
    const value = typeof next === 'function' ? next(settings) : next
    setSettings(value)
    if (!user) return
    const { db } = getFirebase()
    if (!db) return
    try {
      const ref = doc(db, 'artifacts', getAppId(), 'users', user.uid, 'preferences', 'general')
      await setDoc(ref, value, { merge: true })
    } catch {}
  }

  return [settings, update]
}
