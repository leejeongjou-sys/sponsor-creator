import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, Bookmark, Camera, ChevronLeft, ChevronRight, Check, Copy,
  Download, FolderOpen, Hash, Heart, ImagePlus, Loader2, MessageCircle, MessageSquareText,
  MoreHorizontal, RefreshCw, Send, Sparkles, Trash2, ZoomIn,
} from 'lucide-react'
import { POSE_BY_ID, PRESETS } from '../constants'

export function PreviewPanel({
  generatedResults, isGenerating, modelImage, bgType, selectedPreset,
  onDownload, onRegenerateSlot,
  caption, isCaptioning, onGenerateCaption, notify,
  cloudReady, generations, onSaveGeneration, onLoadGeneration, onDeleteGeneration,
}) {
  const [activeTab, setActiveTab] = useState('current') // 'current' | 'gallery'
  const [isSavingGen, setIsSavingGen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [pan, setPan] = useState({ isDragging: false, startX: 0, startY: 0, tX: 0, tY: 0 })
  const dragRef = useRef({ startX: 0, startY: 0 })

  useEffect(() => {
    setCurrentIndex(0)
    setIsZoomed(false)
    setPan({ isDragging: false, startX: 0, startY: 0, tX: 0, tY: 0 })
  }, [generatedResults.length])

  // Clamp currentIndex if results shrink
  useEffect(() => {
    if (currentIndex >= generatedResults.length) setCurrentIndex(Math.max(0, generatedResults.length - 1))
  }, [generatedResults.length, currentIndex])

  const down = (e) => {
    if (e.target.closest('button')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY }
    if (isZoomed) setPan((p) => ({ ...p, isDragging: true, startX: e.clientX - p.tX, startY: e.clientY - p.tY }))
  }
  const move = (e) => {
    if (isZoomed && pan.isDragging) setPan((p) => ({ ...p, tX: e.clientX - p.startX, tY: e.clientY - p.startY }))
  }
  const up = (e) => {
    if (e.target.closest('button')) return
    setPan((p) => ({ ...p, isDragging: false }))
    const dx = Math.abs(e.clientX - dragRef.current.startX)
    const dy = Math.abs(e.clientY - dragRef.current.startY)
    if (dx < 5 && dy < 5) {
      setIsZoomed(!isZoomed)
      if (!isZoomed) setPan({ isDragging: false, startX: 0, startY: 0, tX: 0, tY: 0 })
    }
  }

  const hasResults = generatedResults.length > 0
  const presetName = PRESETS.find((p) => p.id === selectedPreset)?.name
  const current = generatedResults[currentIndex]
  const currentPose = current ? POSE_BY_ID[current.poseId] : null

  const handleSaveCurrent = async () => {
    setIsSavingGen(true)
    try { await onSaveGeneration() }
    finally { setIsSavingGen(false) }
  }

  return (
    <div className="flex-1 lg:min-w-[320px] bg-canvas flex flex-col relative overflow-y-auto shrink-0 custom-scrollbar">
      {cloudReady && (
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#EAEAEA] px-4 py-2 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${activeTab === 'current' ? 'bg-canvas-sunken text-ink' : 'text-ink-muted hover:text-ink'}`}
          >
            현재 작업
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'gallery' ? 'bg-canvas-sunken text-ink' : 'text-ink-muted hover:text-ink'}`}
          >
            <FolderOpen className="w-3 h-3" /> 갤러리 ({generations.length})
          </button>
        </div>
      )}

      {activeTab === 'gallery' && cloudReady ? (
        <GalleryView generations={generations} onLoad={onLoadGeneration} onDelete={onDeleteGeneration} />
      ) : isGenerating && !hasResults ? (
        <LoadingState modelImage={modelImage} />
      ) : hasResults ? (
        <article className="w-full max-w-[470px] mx-auto bg-white sm:border sm:border-[#EAEAEA] sm:my-6 flex flex-col animate-scale-in sm:rounded-xl overflow-hidden shadow-studio">
          {/* Header */}
          <div className="h-14 px-3.5 flex items-center justify-between shrink-0 border-b border-[#F5F5F3]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full insta-gradient p-[1.5px]">
                <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
                  {modelImage ? <img src={modelImage} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full bg-canvas-sunken" />}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-sm font-semibold leading-tight">sponsor_creator</h3>
                <p className="text-[11px] text-ink-muted leading-tight">Sponsored</p>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-ink" strokeWidth={1.8} />
          </div>

          {/* Image area */}
          <div
            className="relative w-full bg-canvas-sunken overflow-hidden shrink-0 group flex items-center justify-center select-none"
            onMouseDown={down}
            onMouseMove={move}
            onMouseUp={up}
            onMouseLeave={up}
          >
            <div
              className={`w-full aspect-[4/5] ${!pan.isDragging ? 'transition-transform duration-200' : ''} ${current?.status === 'ok' ? (isZoomed ? 'cursor-move' : 'cursor-zoom-in') : 'cursor-default'}`}
              style={{ transform: isZoomed ? `translate(${pan.tX}px, ${pan.tY}px) scale(2.5)` : 'translate(0,0) scale(1)' }}
            >
              {current?.status === 'ok' && current.url && (
                <img src={current.url} className="w-full h-full object-cover pointer-events-none" alt="Generated" draggable={false} />
              )}
              {current?.status === 'loading' && <SlotLoader />}
              {current?.status === 'failed' && <SlotError onRetry={() => onRegenerateSlot(currentIndex)} />}
            </div>

            {/* Pose chip */}
            {currentPose && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 pointer-events-none">
                <span>{currentPose.emoji}</span>
                <span>{currentPose.label}</span>
              </div>
            )}

            {/* Regenerate slot button */}
            {current?.status !== 'loading' && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRegenerateSlot(currentIndex) }}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
                title="이 컷만 다시 생성"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}

            {/* Click-to-zoom hint */}
            {!isZoomed && current?.status === 'ok' && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5" strokeWidth={2} /> 클릭하여 디테일 확인
                </div>
              </div>
            )}

            {/* Carousel arrows */}
            {!isZoomed && generatedResults.length > 1 && (
              <>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => (i > 0 ? i - 1 : generatedResults.length - 1)) }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-studio hover:bg-white transition-all"
                  aria-label="이전"
                >
                  <ChevronLeft className="w-5 h-5 text-ink" strokeWidth={1.8} />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => (i < generatedResults.length - 1 ? i + 1 : 0)) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow-studio hover:bg-white transition-all"
                  aria-label="다음"
                >
                  <ChevronRight className="w-5 h-5 text-ink" strokeWidth={1.8} />
                </button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                  {generatedResults.map((r, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        currentIndex === idx ? 'bg-accent' :
                        r.status === 'failed' ? 'bg-red-400/80' :
                        r.status === 'loading' ? 'bg-yellow-400/80 animate-pulse' :
                        'bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* IG-style action bar */}
          <div className="px-3.5 pt-3 pb-1 flex justify-between items-center">
            <div className="flex gap-3.5">
              <Heart className="w-6 h-6 text-ink hover:text-red-500 cursor-pointer transition-colors" strokeWidth={1.8} />
              <MessageCircle className="w-6 h-6 text-ink cursor-pointer hover:text-ink-muted transition-colors" strokeWidth={1.8} />
              <Send className="w-6 h-6 text-ink cursor-pointer hover:text-ink-muted transition-colors" strokeWidth={1.8} />
            </div>
            <Bookmark className="w-6 h-6 text-ink cursor-pointer hover:text-ink-muted transition-colors" strokeWidth={1.8} />
          </div>

          {/* Caption preview (IG-look) */}
          <div className="px-4 pb-3">
            <p className="text-sm font-semibold mb-1">좋아요 12,345개</p>
            {caption ? (
              <CaptionDisplay caption={caption} notify={notify} />
            ) : (
              <>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold mr-1.5">sponsor_creator</span>
                  새로운 컬렉션 OOTD ✨ {bgType === 'preset' ? presetName : '핫플레이스'}에서!
                  <span className="text-[#00376b] block mt-0.5">#협찬 #OOTD #데일리룩</span>
                </p>
                <p className="text-[10px] text-ink-muted mt-1.5">1시간 전</p>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            <button
              onClick={onGenerateCaption}
              disabled={isCaptioning}
              className="w-full bg-white border border-ink text-ink font-semibold py-2.5 rounded-lg hover:bg-canvas-sunken disabled:opacity-60 disabled:cursor-wait transition-colors flex items-center justify-center gap-1.5 text-sm active:scale-[0.99]"
            >
              {isCaptioning
                ? <><Loader2 className="w-4 h-4 animate-spin" /> 캡션 생성 중…</>
                : <><Sparkles className="w-4 h-4" strokeWidth={2} /> {caption ? '캡션 다시 생성' : '캡션·해시태그 자동 생성'}</>
              }
            </button>
            <div className="flex gap-2">
              {cloudReady && (
                <button
                  onClick={handleSaveCurrent}
                  disabled={isSavingGen}
                  className="flex-1 bg-white border border-[#E5E5E5] text-ink font-semibold py-2.5 rounded-lg hover:border-ink transition-colors flex items-center justify-center gap-1.5 text-sm disabled:opacity-60"
                  title="갤러리에 저장"
                >
                  {isSavingGen
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중…</>
                    : <><ImagePlus className="w-4 h-4" strokeWidth={2} /> 갤러리에 저장</>
                  }
                </button>
              )}
              <button
                onClick={() => onDownload(currentIndex)}
                disabled={current?.status !== 'ok'}
                className="flex-1 bg-ink text-white font-semibold py-2.5 rounded-lg hover:bg-ink-soft disabled:bg-canvas-sunken disabled:text-ink-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 text-sm shadow-studio active:scale-[0.99]"
              >
                <Download className="w-4 h-4" strokeWidth={2} /> 다운로드
              </button>
            </div>
          </div>
        </article>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function CaptionDisplay({ caption, notify }) {
  const [tone, setTone] = useState(0)
  const [copied, setCopied] = useState(null) // 'body' | 'tags' | 'full' | null

  const body = caption.captions[tone]?.text || ''
  const tags = caption.hashtags || []
  const full = `${body}\n\n${tags.join(' ')}`

  const copy = async (text, kind) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      if (notify) notify(`${kind === 'body' ? '본문' : kind === 'tags' ? '해시태그' : '전체'} 복사됨`)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      if (notify) notify('복사 실패', 'error')
    }
  }

  return (
    <div className="space-y-2.5 animate-fade-in">
      {/* Tone tabs */}
      <div className="flex gap-1 bg-canvas-sunken p-0.5 rounded-md">
        {caption.captions.map((c, i) => (
          <button
            key={i}
            onClick={() => setTone(i)}
            className={`flex-1 py-1 text-[10px] font-semibold rounded transition-all ${tone === i ? 'bg-white shadow-studio text-ink' : 'text-ink-muted hover:text-ink'}`}
          >
            {c.tone}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="relative group">
        <p className="text-sm leading-relaxed whitespace-pre-line">
          <span className="font-semibold mr-1.5">sponsor_creator</span>
          {body}
        </p>
        <button
          onClick={() => copy(body, 'body')}
          className="absolute top-0 right-0 p-1 text-ink-muted opacity-0 group-hover:opacity-100 hover:text-ink transition-all"
          title="본문 복사"
        >
          {copied === 'body' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Hashtags */}
      <div className="relative group">
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className={`text-[11px] ${t === '#광고' || t === '#협찬' ? 'text-red-600 font-semibold' : 'text-[#00376b]'}`}>
              {t}
            </span>
          ))}
        </div>
        <button
          onClick={() => copy(tags.join(' '), 'tags')}
          className="absolute top-0 right-0 p-1 text-ink-muted opacity-0 group-hover:opacity-100 hover:text-ink transition-all"
          title="해시태그 복사"
        >
          {copied === 'tags' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Hash className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Copy-all */}
      <button
        onClick={() => copy(full, 'full')}
        className="w-full mt-1 py-1.5 text-[11px] font-semibold rounded border border-[#E5E5E5] bg-white text-ink-soft hover:border-ink hover:text-ink transition-all flex items-center justify-center gap-1.5"
      >
        {copied === 'full' ? <><Check className="w-3 h-3 text-green-600" /> 전체 복사됨</> : <><MessageSquareText className="w-3 h-3" /> 본문 + 해시태그 전체 복사</>}
      </button>

      <p className="text-[10px] text-red-500 font-medium leading-tight">
        ⚠️ #광고 #협찬 은 공정거래위원회 의무 표기입니다 (수정·삭제 시 과태료 대상).
      </p>
    </div>
  )
}

function SlotLoader() {
  return (
    <div className="w-full h-full bg-canvas-sunken flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-ink/15 border-t-ink animate-spin" />
        <p className="text-[11px] font-semibold text-ink-soft">이 컷 생성 중…</p>
      </div>
    </div>
  )
}

function SlotError({ onRetry }) {
  return (
    <div className="w-full h-full bg-red-50/50 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
      <p className="text-xs font-semibold text-red-600">이 컷 생성 실패</p>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-md text-[11px] font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5"
      >
        <RefreshCw className="w-3 h-3" /> 다시 시도
      </button>
    </div>
  )
}

function LoadingState({ modelImage }) {
  return (
    <article className="w-full max-w-[470px] mx-auto bg-white sm:border sm:border-[#EAEAEA] sm:my-6 flex flex-col animate-fade-in sm:rounded-xl overflow-hidden shadow-studio">
      <div className="h-14 px-3.5 flex items-center gap-3 border-b border-[#F5F5F3]">
        <div className="w-8 h-8 rounded-full insta-gradient p-[1.5px]">
          <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
            {modelImage ? <img src={modelImage} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full bg-canvas-sunken" />}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-3 w-28 bg-canvas-sunken rounded animate-pulse" />
          <div className="h-2 w-16 bg-canvas-sunken rounded animate-pulse" />
        </div>
      </div>
      <div className="w-full aspect-[4/5] bg-canvas-sunken relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-ink/15 border-t-ink animate-spin" />
            <p className="text-xs font-semibold text-ink-soft">화보 생성 중…</p>
            <p className="text-[10px] text-ink-muted">잠시만 기다려 주세요</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="h-3 w-24 bg-canvas-sunken rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-canvas-sunken rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-canvas-sunken rounded animate-pulse" />
      </div>
    </article>
  )
}

function GalleryView({ generations, onLoad, onDelete }) {
  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-ink-muted h-full w-full text-center p-8">
        <div className="w-20 h-20 rounded-full border-2 border-[#E5E5E5] flex items-center justify-center mb-4 bg-white">
          <FolderOpen className="w-8 h-8 text-ink-muted/50" strokeWidth={1.5} />
        </div>
        <h2 className="text-base font-semibold text-ink-soft mb-2">갤러리가 비어 있어요</h2>
        <p className="text-sm font-normal text-ink-muted leading-relaxed">
          화보를 만들고 <span className="text-ink font-semibold">갤러리에 저장</span> 버튼으로<br />여기 보관할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 animate-fade-in">
      {generations.map((gen) => (
        <GalleryCard key={gen.id} gen={gen} onLoad={onLoad} onDelete={onDelete} />
      ))}
    </div>
  )
}

function GalleryCard({ gen, onLoad, onDelete }) {
  const firstShot = gen.shots?.[0]
  const shotCount = gen.shots?.length || 0
  const date = gen.createdAt?.toDate ? gen.createdAt.toDate() : null
  const dateLabel = date ? `${date.getMonth() + 1}/${date.getDate()}` : ''

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-lg overflow-hidden shadow-studio group">
      <button
        onClick={() => onLoad(gen)}
        className="block w-full aspect-[4/5] bg-canvas-sunken relative cursor-pointer"
      >
        {firstShot?.url ? (
          <img src={firstShot.url} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted">
            <Camera className="w-8 h-8" />
          </div>
        )}
        {shotCount > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
            {shotCount}컷
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
          <span className="text-white text-[11px] font-semibold bg-black/60 px-2 py-1 rounded">불러오기</span>
        </div>
      </button>
      <div className="px-2.5 py-2 flex items-center justify-between gap-1">
        <span className="text-[10px] text-ink-muted font-medium tabular-nums">{dateLabel}</span>
        <button
          onClick={() => { if (confirm('이 화보 그룹을 삭제하시겠어요?')) onDelete(gen) }}
          className="p-1 text-ink-muted/60 hover:text-red-500 transition-colors"
          title="삭제"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-ink-muted h-full w-full text-center p-8">
      <div className="w-20 h-20 rounded-full border-2 border-[#E5E5E5] flex items-center justify-center mb-4 bg-white">
        <Camera className="w-8 h-8 text-ink-muted/50" strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-semibold text-ink-soft mb-2">게시물 미리보기</h2>
      <p className="text-sm font-normal text-ink-muted leading-relaxed">사진과 설정을 완료하고<br />&apos;새 게시물 만들기&apos;를 누르세요.</p>
    </div>
  )
}
