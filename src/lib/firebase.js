import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

let app, auth, db, storage, persistenceSet = false

export const getFirebase = () => {
  if (app) return { app, auth, db, storage }
  try {
    const configString = import.meta.env.VITE_FIREBASE_CONFIG
    if (!configString) return { app: null, auth: null, db: null, storage: null }
    const config = JSON.parse(configString)
    if (!config || Object.keys(config).length === 0) return { app: null, auth: null, db: null, storage: null }
    app = initializeApp(config)
    auth = getAuth(app)
    if (!persistenceSet) {
      persistenceSet = true
      setPersistence(auth, browserLocalPersistence).catch(() => {})
    }
    db = initializeFirestore(app, { localCache: memoryLocalCache() })
    storage = config.storageBucket ? getStorage(app) : null
  } catch (e) {
    console.error('Firebase init failed:', e)
  }
  return { app, auth, db, storage }
}

export const getAppId = () => import.meta.env.VITE_APP_ID ?? 'sponsor-creator'
