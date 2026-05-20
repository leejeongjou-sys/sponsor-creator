import { useState } from 'react'
import { Header } from './components/Header'
import { SourcePanel } from './components/SourcePanel'
import { DirectionPanel } from './components/DirectionPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { Notification } from './components/Notification'
import { useAuth } from './hooks/useAuth'
import { useSettings } from './hooks/useSettings'
import { useNotification } from './hooks/useNotification'
import { fileToCompressedDataUrl } from './lib/image'
import { generateImage } from './lib/gemini'
import { LIGHTING_OPTIONS, PRESETS, TIME_OPTIONS } from './constants'

const stripDataUrl = (dataUrl) => dataUrl.split(',')[1]

export default function App() {
  const user = useAuth()
  const [settings, setSettings] = useSettings(user)
  const { notification, notify } = useNotification()

  const [sponsorImage, setSponsorImage] = useState(null)
  const [detailImages, setDetailImages] = useState([])
  const [modelImage, setModelImage] = useState(null)
  const [referenceImage, setReferenceImage] = useState(null)
  const [itemCategory, setItemCategory] = useState('top')

  const [bgType, setBgType] = useState('none')
  const [selectedPreset, setSelectedPreset] = useState('seongsu')
  const [customBgImage, setCustomBgImage] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState('none')
  const [lighting, setLighting] = useState('none')
  const [prompt, setPrompt] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResults, setGeneratedResults] = useState([])

  const uploadSingle = (setter) => async (file) => {
    if (!file) return
    try { setter(await fileToCompressedDataUrl(file)) }
    catch { notify('이미지 처리 실패', 'error') }
  }
  const uploadDetail = async (file) => {
    if (!file) return
    try {
      const data = await fileToCompressedDataUrl(file, 768, 0.8)
      setDetailImages((prev) => (prev.length < 5 ? [...prev, data] : prev))
    } catch { notify('이미지 처리 실패', 'error') }
  }

  const canGenerate = !!modelImage && !!sponsorImage

  const handleGenerate = async () => {
    if (!canGenerate) return notify('모델 얼굴과 협찬 의상 이미지는 필수입니다.', 'error')
    if (bgType === 'custom' && !customBgImage) return notify('직접 업로드할 배경 이미지를 올려주세요.', 'error')
    if (!settings.apiKey) return notify('우측 상단에 API Key를 설정해주세요.', 'error')

    setIsGenerating(true)
    setGeneratedResults([])

    try {
      const bgContext =
        bgType === 'preset' ? PRESETS.find((p) => p.id === selectedPreset)?.en :
        bgType === 'custom' ? 'Match the exact environment and background shown in the provided Custom Background Reference image.' :
        referenceImage ? 'Match the exact environment and background shown in the [Reference Image (Pose/Mood)].' :
        'Neutral clean studio background, minimalist.'

      const timeContext = TIME_OPTIONS.find((t) => t.id === timeOfDay)?.en
      const lightingContext = LIGHTING_OPTIONS.find((l) => l.id === lighting)?.en
      const detailInfo = detailImages.length > 0
        ? `\n- The user has provided ${detailImages.length} DETAIL IMAGES. You MUST strictly extract the fabric texture, brand logo, stitching, and micro-patterns from these details and apply them perfectly to the clothing.`
        : ''

      const cached = {
        model: stripDataUrl(modelImage),
        sponsor: stripDataUrl(sponsorImage),
        details: detailImages.map(stripDataUrl),
        reference: referenceImage ? stripDataUrl(referenceImage) : null,
        customBg: bgType === 'custom' && customBgImage ? stripDataUrl(customBgImage) : null,
      }

      const buildBasePrompt = (requireFace) => {
        const faceRule = requireFace
          ? `CRITICAL RULE 1: ABSOLUTE FACIAL IDENTITY CLONE (100% MATCH REQUIRED) — USER'S TOP PRIORITY
- The generated model's face MUST perfectly clone the [Model Face Image].
- Do NOT alter the eye shape, nose bridge, lip fullness, jawline, or skin tone.
- The age, ethnicity, and exact facial micro-proportions must remain mathematically identical. This is the absolute highest priority.
- If the model's face looks even slightly different, it is a critical failure.`
          : `CRITICAL RULE 1: STRICTLY FACELESS COMPOSITION (WAIST-DOWN ONLY)
- Since this specific shot focuses strictly on the lower body, the model's head and face MUST BE COMPLETELY CROPPED OUT.
- Frame the shot strictly from the waist down to focus entirely on the pants/skirt.
- Use the [Model Face Image] ONLY to match the body's skin tone. NO FACE ALLOWED.`

        return `
TASK: High-End Instagram Influencer Sponsorship Post Generation.

${faceRule}

CRITICAL RULE 2: SPONSOR ITEM INTEGRATION
- The model must be wearing the exact clothing/item shown in the [Sponsor Item Image].
- Retain exact silhouette, color, and textile behavior.${detailInfo}

CRITICAL RULE 3: POSE & MOOD
${referenceImage ? '- MATCH the overall posture, body angle, and mood shown in the [Reference Image (Pose/Mood)].' : '- Generate a natural, high-end editorial Instagram pose.'}

CRITICAL RULE 4: ENVIRONMENT, LIGHTING & VIBE
- Location: ${bgContext}
- Time of Day: ${timeContext}
- Lighting Style: ${lightingContext}
- VIBE: Trending Instagram/TikTok influencer aesthetic. Authentic SNS OOTD style.

CRITICAL RULE 5: OUTPUT FORMAT & FRAMING
- Generate a SINGLE, complete, unified photograph.
- ABSOLUTELY NO collages, NO split screens, NO multi-panel layouts, NO product-only shots without the model.
- The image must feature the ONE single model.

USER DIRECTION: ${prompt || 'Make it look like a highly engaged, viral Instagram/TikTok fashion post.'}`
      }

      const buildParts = (variationText, requireFace) => {
        const p = [{ text: `${buildBasePrompt(requireFace)}\n\n${variationText}` }]
        p.push({ text: '\n[Model Face Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: cached.model } })
        p.push({ text: '\n[Sponsor Item Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: cached.sponsor } })
        if (cached.details.length > 0) {
          p.push({ text: `\n[${cached.details.length} Sponsor Detail Images]:` })
          cached.details.forEach((d) => p.push({ inlineData: { mimeType: 'image/jpeg', data: d } }))
        }
        if (cached.reference) p.push({ text: '\n[Reference Image (Pose/Mood)]:' }, { inlineData: { mimeType: 'image/jpeg', data: cached.reference } })
        if (cached.customBg) p.push({ text: '\n[Custom Background Reference Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: cached.customBg } })
        return p
      }

      const isBottom = itemCategory === 'bottom'

      const fullBodyText =
        'VARIATION 1 (STRICT FULL BODY SHOT): Frame strictly from head to toe. Show the complete outfit and footwear. Confident dynamic editorial pose, very Instagram-worthy. The face MUST perfectly match the reference.'

      const closeUpText = isBottom
        ? 'VARIATION 2 (LOWER-BODY CLOSE-UP): Strictly frame from the waist down. The head and face MUST be completely cropped out. Focus intensely on the styling, fit, and texture of the bottom wear. Natural posing. Single photo only.'
        : 'VARIATION 2 (UPPER-BODY CLOSE-UP): Strictly frame from the waist up (Half-body shot). Focus intensely on the texture, fit, and details of the upper garment/outerwear. The face MUST perfectly match the reference. Single photo only.'

      notify('2 컷(전신 + 클로즈업) 생성 시작! (약 15~30초 소요)')

      const settled = await Promise.allSettled([
        generateImage({ apiKey: settings.apiKey, contentsParts: buildParts(fullBodyText, true), aspectRatio: '4:5' }),
        generateImage({ apiKey: settings.apiKey, contentsParts: buildParts(closeUpText, !isBottom), aspectRatio: '4:5' }),
      ])

      const ok = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value)
      const failed = settled.length - ok.length

      if (ok.length === 0) {
        const firstError = settled.find((r) => r.status === 'rejected')
        throw new Error(firstError?.reason?.message || '이미지 생성 실패')
      }

      setGeneratedResults(ok)
      if (failed > 0) notify(`${ok.length}장 생성 완료, ${failed}장은 실패했어요.`, 'error')
      else notify('성공적으로 업로드 준비가 완료되었습니다!')
    } catch (e) {
      notify(String(e.message), 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (index) => {
    if (!generatedResults[index]) return
    const link = document.createElement('a')
    link.href = generatedResults[index]
    link.download = `Sponsor_Creator_${Date.now()}_${index + 1}.jpg`
    link.click()
  }

  return (
    <div className="flex flex-col h-screen bg-canvas text-ink-soft overflow-hidden">
      <Header apiKey={settings.apiKey} onApiKeyChange={(v) => setSettings({ ...settings, apiKey: v })} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
        <SourcePanel
          sponsorImage={sponsorImage}
          onSponsorUpload={uploadSingle(setSponsorImage)}
          detailImages={detailImages}
          onDetailUpload={uploadDetail}
          onDetailRemove={(i) => setDetailImages((prev) => prev.filter((_, idx) => idx !== i))}
          modelImage={modelImage}
          onModelUpload={uploadSingle(setModelImage)}
          referenceImage={referenceImage}
          onReferenceUpload={uploadSingle(setReferenceImage)}
          itemCategory={itemCategory}
          onItemCategoryChange={setItemCategory}
        />
        <DirectionPanel
          bgType={bgType}
          onBgTypeChange={setBgType}
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
          customBgImage={customBgImage}
          onCustomBgUpload={uploadSingle(setCustomBgImage)}
          timeOfDay={timeOfDay}
          onTimeChange={setTimeOfDay}
          lighting={lighting}
          onLightingChange={setLighting}
          prompt={prompt}
          onPromptChange={setPrompt}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
        />
        <PreviewPanel
          generatedResults={generatedResults}
          isGenerating={isGenerating}
          modelImage={modelImage}
          bgType={bgType}
          selectedPreset={selectedPreset}
          onDownload={handleDownload}
        />
      </div>

      <Notification notification={notification} />
    </div>
  )
}
