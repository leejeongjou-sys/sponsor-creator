import { fetchWithRetry } from './utils'

const MODEL = 'gemini-3.1-flash-image-preview'

const buildConfig = (aspectRatio) => ({
  responseModalities: ['IMAGE'],
  imageConfig: { aspectRatio, imageSize: '4K' },
})

export const generateImage = async ({ apiKey, contentsParts, aspectRatio }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: contentsParts }],
      generationConfig: buildConfig(aspectRatio),
    }),
  })
  const raw = await res.text()
  let data
  try { data = JSON.parse(raw) } catch { data = { error: { message: raw } } }
  if (!res.ok || data?.error) throw new Error(`API Error: ${data?.error?.message || raw}`)

  const imgPart = data?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data)
  if (imgPart?.inlineData?.data) return `data:image/jpeg;base64,${imgPart.inlineData.data}`
  throw new Error('이미지가 생성되지 않았습니다.')
}
