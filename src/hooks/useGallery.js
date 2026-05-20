import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { getAppId, getFirebase } from '../lib/firebase'
import { deleteFromPath, uploadGenerationShot } from '../lib/storage'

const collectionPath = (uid) => `artifacts/${getAppId()}/users/${uid}/generations`

export const useGallery = (user) => {
  const [generations, setGenerations] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user?.uid) { setReady(false); return }
    const { db } = getFirebase()
    if (!db) { setReady(false); return }
    const q = query(collection(db, collectionPath(user.uid)), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setGenerations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setReady(true)
    }, (e) => { console.warn('gallery snapshot error', e); setReady(true) })
    return unsub
  }, [user?.uid])

  // Save a completed generation (uploads each shot to Storage)
  const saveGeneration = async ({ shots, settings, caption }) => {
    if (!user?.uid) throw new Error('로그인 필요')
    const { db, storage } = getFirebase()
    if (!db || !storage) throw new Error('Firebase Storage가 설정되어 있지 않습니다.')

    const docRef = await addDoc(collection(db, collectionPath(user.uid)), {
      createdAt: serverTimestamp(),
      settings,
      caption: caption || null,
      shots: [], // populated below
    })

    try {
      const uploaded = []
      for (let i = 0; i < shots.length; i++) {
        const { url, path } = await uploadGenerationShot(user.uid, docRef.id, i, shots[i].url)
        uploaded.push({ url, path, poseId: shots[i].poseId })
      }
      const { setDoc } = await import('firebase/firestore')
      await setDoc(docRef, { shots: uploaded }, { merge: true })
      return docRef.id
    } catch (e) {
      try { await deleteDoc(docRef) } catch {}
      throw e
    }
  }

  const deleteGeneration = async (generation) => {
    if (!user?.uid) return
    const { db } = getFirebase()
    if (!db) return
    if (Array.isArray(generation.shots)) {
      await Promise.all(generation.shots.map((s) => s.path && deleteFromPath(s.path)))
    }
    await deleteDoc(doc(db, collectionPath(user.uid), generation.id))
  }

  return { generations, ready, saveGeneration, deleteGeneration }
}
