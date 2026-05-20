import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { getAppId, getFirebase } from '../lib/firebase'
import { deleteFromPath, uploadInfluencerFace } from '../lib/storage'

const collectionPath = (uid) => `artifacts/${getAppId()}/users/${uid}/influencers`

export const useInfluencers = (user) => {
  const [influencers, setInfluencers] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user?.uid) { setReady(false); return }
    const { db } = getFirebase()
    if (!db) { setReady(false); return }
    const q = query(collection(db, collectionPath(user.uid)), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setInfluencers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setReady(true)
    }, (e) => { console.warn('influencers snapshot error', e); setReady(true) })
    return unsub
  }, [user?.uid])

  const saveInfluencer = async ({ name, faceDataUrl }) => {
    if (!user?.uid) throw new Error('로그인 필요')
    const { db, storage } = getFirebase()
    if (!db || !storage) throw new Error('Firebase Storage가 설정되어 있지 않습니다.')

    // First create the doc so we have a stable id, then upload to {id}/face.jpg
    const docRef = await addDoc(collection(db, collectionPath(user.uid)), {
      name: name || '이름 없음',
      createdAt: serverTimestamp(),
    })
    try {
      const { url, path } = await uploadInfluencerFace(user.uid, docRef.id, faceDataUrl)
      const { setDoc } = await import('firebase/firestore')
      await setDoc(docRef, { faceUrl: url, facePath: path }, { merge: true })
      return docRef.id
    } catch (e) {
      // rollback: delete the doc
      try { await deleteDoc(docRef) } catch {}
      throw e
    }
  }

  const deleteInfluencer = async (influencer) => {
    if (!user?.uid) return
    const { db } = getFirebase()
    if (!db) return
    if (influencer.facePath) await deleteFromPath(influencer.facePath)
    await deleteDoc(doc(db, collectionPath(user.uid), influencer.id))
  }

  return { influencers, ready, saveInfluencer, deleteInfluencer }
}
