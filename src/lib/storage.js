import { deleteObject, getDownloadURL, ref, uploadString } from 'firebase/storage'
import { getAppId, getFirebase } from './firebase'

// dataUrl: 'data:image/jpeg;base64,XXXX'
// path segments under: artifacts/{appId}/users/{uid}/
// returns { url, path }  — path is what you store in Firestore for later delete
export const uploadDataUrl = async (uid, dataUrl, relativePath) => {
  const { storage } = getFirebase()
  if (!storage) throw new Error('Firebase Storage가 설정되어 있지 않습니다.')
  if (!uid) throw new Error('인증되지 않은 사용자.')
  const fullPath = `artifacts/${getAppId()}/users/${uid}/${relativePath}`
  const fileRef = ref(storage, fullPath)
  await uploadString(fileRef, dataUrl, 'data_url')
  const url = await getDownloadURL(fileRef)
  return { url, path: fullPath }
}

export const deleteFromPath = async (path) => {
  const { storage } = getFirebase()
  if (!storage || !path) return
  try { await deleteObject(ref(storage, path)) }
  catch (e) { console.warn('Storage delete failed:', e.message) }
}

// Convenience: upload a numbered shot of a generation
export const uploadGenerationShot = (uid, generationId, shotIndex, dataUrl) =>
  uploadDataUrl(uid, dataUrl, `generations/${generationId}/shot-${shotIndex}.jpg`)

// Convenience: upload an influencer's face image
export const uploadInfluencerFace = (uid, influencerId, dataUrl) =>
  uploadDataUrl(uid, dataUrl, `influencers/${influencerId}/face.jpg`)
