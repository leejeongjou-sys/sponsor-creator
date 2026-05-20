export const compressImage = (dataUrl, maxWidth = 1536, quality = 0.85) =>
  new Promise((resolve, reject) => {
    if (!dataUrl) return reject(new Error('Invalid dataUrl'))
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })

export const fileToCompressedDataUrl = (file, maxWidth = 1536, quality = 0.85) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        resolve(await compressImage(reader.result, maxWidth, quality))
      } catch (e) { reject(e) }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

// Fetch a remote URL (e.g. Firebase Storage downloadURL) and convert to a base64 data URL,
// so it can be re-used as Gemini inlineData on subsequent generations.
export const fetchAsDataUrl = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
