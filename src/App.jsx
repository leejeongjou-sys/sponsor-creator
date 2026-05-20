import { useEffect, useState } from 'react'
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
import { buildShot, prepareImageStrips } from './lib/promptBuilder'
import { generateCaption } from './lib/captionGen'
import { CAROUSEL_RECOMMENDATIONS, QUICK_RECOMMENDATIONS } from './constants'

export default function App() {
  const user = useAuth()
  const [settings, setSettings] = useSettings(user)
  const { notification, notify } = useNotification()

  // ── Source state ──
  const [sponsorImage, setSponsorImage] = useState(null)
  const [detailImages, setDetailImages] = useState([])
  const [modelImage, setModelImage] = useState(null)
  const [referenceImage, setReferenceImage] = useState(null)
  const [itemCategory, setItemCategory] = useState('top')

  // ── Direction state ──
  const [bgType, setBgType] = useState('none')
  const [selectedPreset, setSelectedPreset] = useState('seongsu')
  const [customBgImage, setCustomBgImage] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState('none')
  const [lighting, setLighting] = useState('none')
  const [prompt, setPrompt] = useState('')

  // ── Mode + pose selection ──
  const [mode, setMode] = useState('quick') // 'quick' | 'carousel'
  const [selectedPoses, setSelectedPoses] = useState(QUICK_RECOMMENDATIONS.top)

  // 모드나 카테고리가 바뀌면 추천 포즈로 자동 채움
  useEffect(() => {
    const map = mode === 'carousel' ? CAROUSEL_RECOMMENDATIONS : QUICK_RECOMMENDATIONS
    setSelectedPoses(map[itemCategory] || map.top)
  }, [mode, itemCategory])

  // ── Generation state ──
  const [isGenerating, setIsGenerating] = useState(false)
  // generatedResults[i]: { url: string, poseId: string, status: 'ok'|'loading'|'failed' }
  const [generatedResults, setGeneratedResults] = useState([])

  // ── Caption state ──
  const [caption, setCaption] = useState(null) // { captions: [{tone,text}], hashtags: [] }
  const [isCaptioning, setIsCaptioning] = useState(false)

  // ── Upload handlers ──
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

  // ── Pre-check + shared image strips ──
  const validateAndPrepareImages = () => {
    if (!canGenerate) { notify('모델 얼굴과 협찬 의상 이미지는 필수입니다.', 'error'); return null }
    if (bgType === 'custom' && !customBgImage) { notify('직접 업로드할 배경 이미지를 올려주세요.', 'error'); return null }
    if (!settings.apiKey) { notify('우측 상단에 API Key를 설정해주세요.', 'error'); return null }
    return prepareImageStrips({ modelImage, sponsorImage, detailImages, referenceImage, customBgImage, bgType })
  }

  const directionPayload = () => ({
    bgType, selectedPreset, referenceImage, timeOfDay, lighting, prompt,
  })

  // ── Full batch generate ──
  const handleGenerate = async () => {
    const images = validateAndPrepareImages()
    if (!images) return

    setIsGenerating(true)
    setCaption(null) // clear previous caption when starting new batch
    setGeneratedResults(selectedPoses.map((poseId) => ({ url: null, poseId, status: 'loading' })))

    notify(`${selectedPoses.length}컷 생성 시작! (${mode === 'carousel' ? '약 30~60초' : '약 15~30초'} 소요)`)

    try {
      const settled = await Promise.allSettled(
        selectedPoses.map((poseId) => generateImage({
          apiKey: settings.apiKey,
          contentsParts: buildShot({ poseId, images, ...directionPayload() }),
          aspectRatio: '4:5',
        }))
      )

      const results = settled.map((r, i) => ({
        poseId: selectedPoses[i],
        url: r.status === 'fulfilled' ? r.value : null,
        status: r.status === 'fulfilled' ? 'ok' : 'failed',
        error: r.status === 'rejected' ? String(r.reason?.message || r.reason) : null,
      }))

      const okCount = results.filter((r) => r.status === 'ok').length
      const failCount = results.length - okCount

      if (okCount === 0) {
        const firstError = results.find((r) => r.error)?.error || '이미지 생성 실패'
        throw new Error(firstError)
      }

      setGeneratedResults(results)
      if (failCount > 0) notify(`${okCount}장 생성 완료, ${failCount}장은 실패 (각 슬롯 '다시' 버튼으로 재시도)`, 'error')
      else notify('성공적으로 업로드 준비가 완료되었습니다!')
    } catch (e) {
      notify(String(e.message), 'error')
      setGeneratedResults([])
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Single slot regenerate ──
  const handleRegenerateSlot = async (slotIndex, overridePoseId = null) => {
    const images = validateAndPrepareImages()
    if (!images) return

    const poseId = overridePoseId || generatedResults[slotIndex]?.poseId
    if (!poseId) return

    setGeneratedResults((prev) => prev.map((r, i) => (i === slotIndex ? { ...r, status: 'loading', poseId } : r)))

    try {
      const url = await generateImage({
        apiKey: settings.apiKey,
        contentsParts: buildShot({ poseId, images, ...directionPayload() }),
        aspectRatio: '4:5',
      })
      setGeneratedResults((prev) => prev.map((r, i) => (i === slotIndex ? { url, poseId, status: 'ok' } : r)))
      notify(`${slotIndex + 1}번 컷 재생성 완료`)
    } catch (e) {
      setGeneratedResults((prev) => prev.map((r, i) => (i === slotIndex ? { ...r, status: 'failed', error: String(e.message) } : r)))
      notify(`${slotIndex + 1}번 컷 재생성 실패: ${e.message}`, 'error')
    }
  }

  // ── Caption generation ──
  const handleGenerateCaption = async () => {
    if (!settings.apiKey) return notify('우측 상단에 API Key를 설정해주세요.', 'error')
    setIsCaptioning(true)
    try {
      const result = await generateCaption({
        apiKey: settings.apiKey,
        itemCategory, bgType, selectedPreset, timeOfDay, lighting,
        userDirection: prompt,
      })
      setCaption(result)
      notify('캡션 생성 완료')
    } catch (e) {
      notify(String(e.message), 'error')
    } finally {
      setIsCaptioning(false)
    }
  }

  // ── Download a slot's image ──
  const handleDownload = (index) => {
    const url = generatedResults[index]?.url
    if (!url) return
    const link = document.createElement('a')
    link.href = url
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
          mode={mode}
          onModeChange={setMode}
          selectedPoses={selectedPoses}
          onSelectedPosesChange={setSelectedPoses}
          itemCategory={itemCategory}
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
          itemCategory={itemCategory}
          onDownload={handleDownload}
          onRegenerateSlot={handleRegenerateSlot}
          caption={caption}
          isCaptioning={isCaptioning}
          onGenerateCaption={handleGenerateCaption}
          notify={notify}
        />
      </div>

      <Notification notification={notification} />
    </div>
  )
}
