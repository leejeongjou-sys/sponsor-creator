import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { SourcePanel } from './components/SourcePanel'
import { DirectionPanel } from './components/DirectionPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { Notification } from './components/Notification'
import { useAuth } from './hooks/useAuth'
import { useSettings } from './hooks/useSettings'
import { useNotification } from './hooks/useNotification'
import { useInfluencers } from './hooks/useInfluencers'
import { useGallery } from './hooks/useGallery'
import { fetchAsDataUrl, fileToCompressedDataUrl } from './lib/image'
import { generateImage } from './lib/gemini'
import { buildShot, prepareImages } from './lib/promptBuilder'
import { generateCaption } from './lib/captionGen'
import { downloadAll, downloadUrl } from './lib/download'
import { getFirebase } from './lib/firebase'
import {
  CAROUSEL_RECOMMENDATIONS, GROUP_CAROUSEL_RECOMMENDATIONS,
  GROUP_QUICK_RECOMMENDATIONS, QUICK_RECOMMENDATIONS,
} from './constants'

const MAX_MODELS = 4
const MAX_DETAILS = 3
const emptyModel = () => ({ face: null, sponsor: null, details: [], category: 'top' })

export default function App() {
  const user = useAuth()
  const [settings, setSettings] = useSettings(user)
  const { notification, notify } = useNotification()

  const cloudReady = !!(user?.uid && getFirebase().storage)
  const { influencers, saveInfluencer, deleteInfluencer } = useInfluencers(user)
  const { generations, saveGeneration, deleteGeneration } = useGallery(user)

  // ── Models (face + outfit per slot) ──
  const [models, setModels] = useState([emptyModel()])
  const [referenceImage, setReferenceImage] = useState(null)

  // ── Direction state ──
  const [bgType, setBgType] = useState('none')
  const [selectedPreset, setSelectedPreset] = useState('seongsu')
  const [customBgImage, setCustomBgImage] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState('none')
  const [lighting, setLighting] = useState('none')
  const [prompt, setPrompt] = useState('')

  const modelCount = models.length
  const isGroup = modelCount > 1

  // Derived category: if all models share one category, use it; else null (no filter)
  const sharedCategory = models.every((m) => m.category === models[0].category) ? models[0].category : null

  // ── Mode + pose selection ──
  const [mode, setMode] = useState('quick')
  const [selectedPoses, setSelectedPoses] = useState(QUICK_RECOMMENDATIONS.top)

  useEffect(() => {
    if (isGroup) {
      setSelectedPoses(mode === 'carousel' ? GROUP_CAROUSEL_RECOMMENDATIONS : GROUP_QUICK_RECOMMENDATIONS)
    } else {
      const cat = sharedCategory || 'top'
      const map = mode === 'carousel' ? CAROUSEL_RECOMMENDATIONS : QUICK_RECOMMENDATIONS
      setSelectedPoses(map[cat] || map.top)
    }
  }, [mode, sharedCategory, isGroup])

  // ── Generation state ──
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResults, setGeneratedResults] = useState([])

  // ── Caption ──
  const [caption, setCaption] = useState(null)
  const [isCaptioning, setIsCaptioning] = useState(false)

  // ── Model slot mutators ──
  const updateModel = (index, patch) => {
    setModels((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  const addModelSlot = () => {
    setModels((prev) => (prev.length < MAX_MODELS ? [...prev, emptyModel()] : prev))
  }
  const removeModelSlot = (index) => {
    setModels((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  // ── Upload helpers for a model slot ──
  const uploadModelField = (index, field) => async (file) => {
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      updateModel(index, { [field]: dataUrl })
    } catch { notify('이미지 처리 실패', 'error') }
  }
  const uploadModelDetail = (index) => async (file) => {
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 768, 0.8)
      setModels((prev) => prev.map((m, i) => (
        i === index && m.details.length < MAX_DETAILS ? { ...m, details: [...m.details, dataUrl] } : m
      )))
    } catch { notify('이미지 처리 실패', 'error') }
  }
  const removeModelDetail = (index, detailIndex) => {
    setModels((prev) => prev.map((m, i) => (
      i === index ? { ...m, details: m.details.filter((_, di) => di !== detailIndex) } : m
    )))
  }
  const loadInfluencerAt = async (index, inf) => {
    if (!inf?.faceUrl) return
    try {
      const dataUrl = await fetchAsDataUrl(inf.faceUrl)
      updateModel(index, { face: dataUrl })
      notify(`'${inf.name}' 얼굴 불러옴`)
    } catch {
      notify('인플루언서 얼굴을 불러오지 못했어요', 'error')
    }
  }

  // ── Reference / custom bg single uploads ──
  const uploadSingle = (setter) => async (file) => {
    if (!file) return
    try { setter(await fileToCompressedDataUrl(file)) }
    catch { notify('이미지 처리 실패', 'error') }
  }

  // ── Validation ──
  const incompleteIndices = models
    .map((m, i) => (m.face && m.sponsor ? -1 : i))
    .filter((i) => i >= 0)
  const canGenerate = incompleteIndices.length === 0

  const validateAndPrepare = () => {
    if (!canGenerate) {
      const slots = incompleteIndices.map((i) => `${i + 1}번`).join(', ')
      notify(`${slots} 모델에 얼굴과 협찬 의상을 모두 올려주세요.`, 'error')
      return null
    }
    if (bgType === 'custom' && !customBgImage) { notify('직접 업로드할 배경 이미지를 올려주세요.', 'error'); return null }
    if (!settings.apiKey) { notify('우측 상단에 API Key를 설정해주세요.', 'error'); return null }
    return prepareImages({ models, referenceImage, customBgImage, bgType })
  }

  const directionPayload = () => ({
    bgType, selectedPreset, referenceImage, timeOfDay, lighting, prompt,
  })

  // ── Full batch generate ──
  const handleGenerate = async () => {
    const prepared = validateAndPrepare()
    if (!prepared) return

    setIsGenerating(true)
    setCaption(null)
    setGeneratedResults(selectedPoses.map((poseId) => ({ url: null, poseId, status: 'loading' })))

    const personLabel = modelCount === 1 ? '' : ` · ${modelCount}인`
    notify(`${selectedPoses.length}컷${personLabel} 생성 시작! (${mode === 'carousel' ? '약 30~60초' : '약 15~30초'} 소요)`)

    try {
      const settled = await Promise.allSettled(
        selectedPoses.map((poseId) => generateImage({
          apiKey: settings.apiKey,
          contentsParts: buildShot({ poseId, prepared, models, ...directionPayload() }),
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
    const prepared = validateAndPrepare()
    if (!prepared) return

    const poseId = overridePoseId || generatedResults[slotIndex]?.poseId
    if (!poseId) return

    setGeneratedResults((prev) => prev.map((r, i) => (i === slotIndex ? { ...r, status: 'loading', poseId } : r)))

    try {
      const url = await generateImage({
        apiKey: settings.apiKey,
        contentsParts: buildShot({ poseId, prepared, models, ...directionPayload() }),
        aspectRatio: '4:5',
      })
      setGeneratedResults((prev) => prev.map((r, i) => (i === slotIndex ? { url, poseId, status: 'ok' } : r)))
      notify(`${slotIndex + 1}번 컷 재생성 완료`)
    } catch (e) {
      setGeneratedResults((prev) => prev.map((r, i) => (i === slotIndex ? { ...r, status: 'failed', error: String(e.message) } : r)))
      notify(`${slotIndex + 1}번 컷 재생성 실패: ${e.message}`, 'error')
    }
  }

  const handleSaveInfluencer = async ({ name, faceDataUrl }) => {
    try {
      await saveInfluencer({ name, faceDataUrl })
      notify(`'${name}' 인플루언서 저장됨`)
    } catch (e) {
      notify(String(e.message), 'error')
      throw e
    }
  }

  // ── Gallery ──
  const handleSaveGeneration = async () => {
    const okShots = generatedResults.filter((r) => r.status === 'ok' && r.url)
    if (okShots.length === 0) return notify('저장할 화보가 없습니다.', 'error')
    try {
      // Snapshot stores only category-level metadata (not the heavy images themselves)
      const settingsSnapshot = {
        mode, selectedPoses, bgType, selectedPreset,
        timeOfDay, lighting, prompt,
        modelCount,
        categories: models.map((m) => m.category),
      }
      await saveGeneration({
        shots: okShots.map((r) => ({ url: r.url, poseId: r.poseId })),
        settings: settingsSnapshot,
        caption,
      })
      notify('갤러리에 저장 완료')
    } catch (e) {
      notify(`갤러리 저장 실패: ${e.message}`, 'error')
    }
  }

  const handleLoadGeneration = (gen) => {
    if (!gen?.shots?.length) return
    setGeneratedResults(gen.shots.map((s) => ({ url: s.url, poseId: s.poseId, status: 'ok' })))
    if (gen.caption) setCaption(gen.caption)
    const s = gen.settings || {}
    if (s.bgType) setBgType(s.bgType)
    if (s.selectedPreset) setSelectedPreset(s.selectedPreset)
    if (s.timeOfDay) setTimeOfDay(s.timeOfDay)
    if (s.lighting) setLighting(s.lighting)
    if (typeof s.prompt === 'string') setPrompt(s.prompt)
    if (s.mode) setMode(s.mode)
    if (Array.isArray(s.selectedPoses)) setSelectedPoses(s.selectedPoses)
    // Note: model images are not restored (privacy/storage). User can re-upload.
    notify('갤러리에서 불러옴 (모델·옷은 다시 올려주세요)')
  }

  const handleDeleteGeneration = async (gen) => {
    try { await deleteGeneration(gen); notify('갤러리에서 삭제됨') }
    catch (e) { notify(`삭제 실패: ${e.message}`, 'error') }
  }

  // ── Caption — primary category drives the brand tone ──
  const handleGenerateCaption = async () => {
    if (!settings.apiKey) return notify('우측 상단에 API Key를 설정해주세요.', 'error')
    setIsCaptioning(true)
    try {
      const result = await generateCaption({
        apiKey: settings.apiKey,
        itemCategory: sharedCategory || models[0]?.category || 'top',
        bgType, selectedPreset, timeOfDay, lighting,
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

  const handleDownload = async (index) => {
    const url = generatedResults[index]?.url
    if (!url) return
    try {
      await downloadUrl(url, `Sponsor_Creator_${Date.now()}_${index + 1}.jpg`)
    } catch (e) {
      notify(`다운로드 실패: ${e.message}`, 'error')
    }
  }

  const handleDownloadAll = async () => {
    const ok = generatedResults.filter((r) => r.status === 'ok' && r.url)
    if (ok.length === 0) return notify('다운로드할 화보가 없습니다.', 'error')
    notify(`${ok.length}장 다운로드 시작…`)
    try {
      await downloadAll(ok)
      notify(`${ok.length}장 다운로드 완료`)
    } catch (e) {
      notify(`다운로드 실패: ${e.message}`, 'error')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-canvas text-ink-soft overflow-hidden">
      <Header apiKey={settings.apiKey} onApiKeyChange={(v) => setSettings({ ...settings, apiKey: v })} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden w-full">
        <SourcePanel
          models={models}
          maxModels={MAX_MODELS}
          maxDetails={MAX_DETAILS}
          onUpdateModel={updateModel}
          onAddModel={addModelSlot}
          onRemoveModel={removeModelSlot}
          onUploadModelField={uploadModelField}
          onUploadModelDetail={uploadModelDetail}
          onRemoveModelDetail={removeModelDetail}
          onLoadInfluencerAt={loadInfluencerAt}
          referenceImage={referenceImage}
          onReferenceUpload={uploadSingle(setReferenceImage)}
          cloudReady={cloudReady}
          cloudInfluencers={influencers}
          onSaveInfluencer={handleSaveInfluencer}
          onDeleteInfluencer={(inf) => deleteInfluencer(inf).catch(() => notify('삭제 실패', 'error'))}
        />
        <DirectionPanel
          mode={mode}
          onModeChange={setMode}
          selectedPoses={selectedPoses}
          onSelectedPosesChange={setSelectedPoses}
          sharedCategory={sharedCategory}
          isGroup={isGroup}
          modelCount={modelCount}
          hasReferenceImage={!!referenceImage}
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
          modelImage={models[0]?.face}
          bgType={bgType}
          selectedPreset={selectedPreset}
          onDownload={handleDownload}
          onDownloadAll={handleDownloadAll}
          onRegenerateSlot={handleRegenerateSlot}
          caption={caption}
          isCaptioning={isCaptioning}
          onGenerateCaption={handleGenerateCaption}
          notify={notify}
          cloudReady={cloudReady}
          generations={generations}
          onSaveGeneration={handleSaveGeneration}
          onLoadGeneration={handleLoadGeneration}
          onDeleteGeneration={handleDeleteGeneration}
        />
      </div>

      <Notification notification={notification} />
    </div>
  )
}
