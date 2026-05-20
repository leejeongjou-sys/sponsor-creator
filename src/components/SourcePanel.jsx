import { useRef, useState } from 'react'
import {
  CheckCircle2, Image as ImageIcon, Loader2, Lock, Plus, Save,
  Shirt, Trash2, UserPlus, UserSquare2, Users, X,
} from 'lucide-react'
import { ImageDropzone } from './ImageDropzone'
import { ITEM_CATEGORIES, SEED_INFLUENCERS, isSeedInfluencer } from '../constants'

export function SourcePanel({
  sponsorImage, onSponsorUpload,
  detailImages, onDetailUpload, onDetailRemove,
  // multi-model props
  modelImages, onModelUploadAt, onModelRemoveAt, onLoadInfluencerAt, onAddModelSlot, maxModels,
  referenceImage, onReferenceUpload,
  itemCategory, onItemCategoryChange,
  cloudReady, cloudInfluencers, onSaveInfluencer, onDeleteInfluencer,
}) {
  const [pickerOpenAt, setPickerOpenAt] = useState(null) // model slot index opening picker
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  const handleMultiDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).slice(0, 5 - detailImages.length)
    files.forEach(onDetailUpload)
  }

  const handleSaveCurrentFace = async () => {
    const primary = modelImages[0]
    if (!primary || !profileName.trim()) return
    setSavingProfile(true)
    try {
      await onSaveInfluencer({ name: profileName.trim(), faceDataUrl: primary })
      setProfileName('')
      setShowSaveForm(false)
    } catch {} finally { setSavingProfile(false) }
  }

  const allProfiles = [
    ...SEED_INFLUENCERS,
    ...(cloudReady ? cloudInfluencers : []),
  ]

  const handlePickProfile = async (inf) => {
    if (pickerOpenAt === null) return
    await onLoadInfluencerAt(pickerOpenAt, inf)
    setPickerOpenAt(null)
  }

  const filledCount = modelImages.filter(Boolean).length
  const canAddMore = modelImages.length < maxModels

  return (
    <div className="flex-1 lg:min-w-[320px] flex flex-col h-full bg-white border-r border-[#EAEAEA] shrink-0 relative">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center">1</div>
            <h2 className="text-sm font-semibold text-ink">소스 업로드</h2>
          </div>
          <div className="flex gap-1 bg-canvas-sunken p-0.5 rounded-md">
            {ITEM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onItemCategoryChange(cat.id)}
                className={`py-1 px-2 text-[10px] font-semibold rounded transition-all ${itemCategory === cat.id ? 'bg-white shadow-studio text-ink' : 'text-ink-muted hover:text-ink'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sponsor + detail cuts ─────────────────── */}
        <div className="flex flex-row gap-3 h-44">
          <div className="w-1/2 h-full">
            <ImageDropzone
              onUpload={onSponsorUpload}
              image={sponsorImage}
              placeholder="협찬 의류 (필수)"
              icon={Shirt}
              className="h-full"
              imgClassName="object-contain p-2 bg-canvas-sunken"
            />
          </div>
          <div className="w-1/2 bg-canvas-sunken rounded-lg border border-[#E5E5E5] p-2.5 flex flex-col">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <span className="text-[11px] font-semibold text-ink-soft">옷 디테일 컷</span>
              <span className="text-[10px] text-ink-muted font-medium tabular-nums">{detailImages.length} / 5</span>
            </div>
            <div
              className="flex-1 flex flex-wrap gap-1.5 overflow-y-auto custom-scrollbar content-start"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={handleMultiDrop}
            >
              {detailImages.map((img, i) => (
                <div key={i} className="w-11 h-11 shrink-0 relative rounded-md overflow-hidden border border-[#E5E5E5] group">
                  <img src={img} className="w-full h-full object-cover" alt={`Detail ${i}`} />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDetailRemove(i) }}
                    className="absolute top-0 right-0 bg-black/70 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {detailImages.length < 5 && (
                <label htmlFor="upload-details" className="w-11 h-11 shrink-0 border border-dashed border-[#D4D4D4] rounded-md flex items-center justify-center cursor-pointer hover:bg-white hover:border-ink transition-colors text-ink-muted">
                  <Plus className="w-4 h-4" strokeWidth={1.8} />
                  <input
                    id="upload-details" type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files).slice(0, 5 - detailImages.length)
                      files.forEach(onDetailUpload); e.target.value = ''
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* ── Model slots (multi-person) ─────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-ink-muted" strokeWidth={2} />
              <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                인플루언서 {filledCount > 1 && <span className="text-accent">({filledCount}인 컷)</span>}
              </span>
            </div>
            {canAddMore && (
              <button
                onClick={onAddModelSlot}
                className="text-[10px] font-semibold text-accent hover:text-accent/80 flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" /> 인물 추가
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {modelImages.map((img, i) => (
              <ModelSlot
                key={i}
                index={i}
                image={img}
                isPrimary={i === 0}
                canRemove={modelImages.length > 1}
                onUpload={onModelUploadAt(i)}
                onRemove={() => onModelRemoveAt(i)}
                onOpenPicker={() => setPickerOpenAt(i)}
              />
            ))}
          </div>
          <p className="text-[10px] text-ink-muted mt-2 leading-relaxed">
            첫 번째 슬롯이 <span className="font-semibold text-ink-soft">협찬 의류 착용자</span>입니다. 나머지는 자연스럽게 코디돼서 함께 등장합니다.
          </p>
        </div>

        {/* ── Reference image ────────────────────────── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 block">참고 (선택)</label>
          <ImageDropzone onUpload={onReferenceUpload} image={referenceImage} placeholder="포즈 / 무드 참고" icon={ImageIcon} className="aspect-[4/2.5]" />
        </div>

        {/* ── Save current primary face ─────────────── */}
        {cloudReady && modelImages[0] && (
          <div className="border border-dashed border-[#E5E5E5] rounded-lg p-2.5">
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full py-1.5 text-[11px] font-semibold text-accent hover:bg-accent/5 rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3 h-3" /> 현재 1번 얼굴을 내 프로필로 저장
              </button>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrentFace()}
                  placeholder="이름 (예: 모델 A)" autoFocus
                  className="flex-1 px-2 py-1 text-[11px] border border-[#E5E5E5] rounded bg-white outline-none focus:border-ink"
                />
                <button
                  onClick={handleSaveCurrentFace} disabled={savingProfile || !profileName.trim()}
                  className="px-2.5 py-1 text-[10px] font-semibold bg-ink text-white rounded hover:bg-ink-soft disabled:opacity-50 flex items-center gap-1"
                >
                  {savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} 저장
                </button>
                <button onClick={() => { setShowSaveForm(false); setProfileName('') }} className="p-1 text-ink-muted hover:text-ink">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-accent" strokeWidth={2} />
          <p className="text-[11px] text-accent font-medium leading-relaxed">
            원본 인플루언서의 이목구비가 100% 일관되게 고정되어 자연스럽게 합성됩니다.
          </p>
        </div>
      </div>

      {/* ── Profile picker modal ──────────────────── */}
      {pickerOpenAt !== null && (
        <ProfilePicker
          seedProfiles={SEED_INFLUENCERS}
          cloudProfiles={cloudReady ? cloudInfluencers : []}
          cloudReady={cloudReady}
          slotIndex={pickerOpenAt}
          onPick={handlePickProfile}
          onUpload={(file) => { onModelUploadAt(pickerOpenAt)(file); setPickerOpenAt(null) }}
          onDeleteCloud={onDeleteInfluencer}
          onClose={() => setPickerOpenAt(null)}
        />
      )}
    </div>
  )
}

function ModelSlot({ index, image, isPrimary, canRemove, onUpload, onRemove, onOpenPicker }) {
  const inputRef = useRef(null)
  return (
    <div className="relative">
      <button
        onClick={onOpenPicker}
        className={`w-full aspect-square rounded-lg border bg-canvas-sunken overflow-hidden relative group transition-all ${
          image
            ? 'border-[#E5E5E5] hover:border-ink shadow-studio'
            : 'border-dashed border-[#D4D4D4] hover:border-ink hover:bg-white'
        }`}
      >
        {image ? (
          <img src={image} className="w-full h-full object-cover" alt={`Model ${index + 1}`} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-ink-muted">
            <UserSquare2 className="w-7 h-7" strokeWidth={1.5} />
            <span className="text-[10px] font-semibold">인물 {index + 1}</span>
            <span className="text-[9px]">탭해서 선택</span>
          </div>
        )}
        {isPrimary && (
          <div className="absolute top-1.5 left-1.5 bg-ink text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
            착용자
          </div>
        )}
        {image && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-[10px] font-semibold">변경</span>
          </div>
        )}
      </button>
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        {image && (
          <label className="bg-white/95 hover:bg-white p-1 rounded-md shadow-studio cursor-pointer" title="새 파일 업로드">
            <Plus className="w-3 h-3 text-ink" />
            <input ref={inputRef} type="file" className="hidden" accept="image/*"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }}
            />
          </label>
        )}
        {canRemove && image && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="bg-white/95 hover:bg-red-50 hover:text-red-500 p-1 rounded-md shadow-studio text-ink-muted"
            title="이 인물 제거"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

function ProfilePicker({ seedProfiles, cloudProfiles, cloudReady, slotIndex, onPick, onUpload, onDeleteCloud, onClose }) {
  const fileInputRef = useRef(null)

  return (
    <div className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-studio-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]">
          <h3 className="text-sm font-semibold text-ink">인물 {slotIndex + 1} 선택</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          {/* New upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border border-dashed border-[#D4D4D4] rounded-lg hover:border-ink hover:bg-canvas-sunken transition-all flex items-center justify-center gap-2 text-ink-soft hover:text-ink"
          >
            <Plus className="w-4 h-4" /> <span className="text-xs font-semibold">새 파일 업로드</span>
          </button>
          <input
            ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }}
          />

          {/* Seed profiles */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="w-3 h-3 text-ink-muted" />
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">시드 인플루언서</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {seedProfiles.map((inf) => (
                <ProfileTile key={inf.id} inf={inf} onClick={() => onPick(inf)} seed />
              ))}
            </div>
          </div>

          {/* Cloud (user-saved) profiles */}
          {cloudReady && (
            <div>
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">내가 저장한 프로필</span>
              {cloudProfiles.length === 0 ? (
                <p className="text-[11px] text-ink-muted/70 italic py-3">없음 — 모델 얼굴을 슬롯에 올린 후 '내 프로필로 저장'을 눌러보세요.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {cloudProfiles.map((inf) => (
                    <ProfileTile
                      key={inf.id} inf={inf}
                      onClick={() => onPick(inf)}
                      onDelete={!isSeedInfluencer(inf) ? () => { if (confirm(`'${inf.name}' 삭제?`)) onDeleteCloud(inf) } : null}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileTile({ inf, onClick, onDelete, seed }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="w-full flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-canvas-sunken transition-colors"
      >
        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${seed ? 'border-ink/20' : 'border-white'} shadow-studio bg-canvas-sunken`}>
          {inf.faceUrl ? (
            <img src={inf.faceUrl} className="w-full h-full object-cover" alt={inf.name}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted"><UserSquare2 className="w-6 h-6" /></div>
          )}
        </div>
        <span className="text-[10px] font-semibold text-ink-soft truncate max-w-full">{inf.name}</span>
      </button>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  )
}
