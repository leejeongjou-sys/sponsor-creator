import { useRef, useState } from 'react'
import {
  CheckCircle2, Image as ImageIcon, Loader2, Lock, Plus, Save,
  Shirt, Trash2, UserPlus, UserSquare2, Users, X,
} from 'lucide-react'
import { ImageDropzone } from './ImageDropzone'
import { ITEM_CATEGORIES, SEED_INFLUENCERS, isSeedInfluencer } from '../constants'

export function SourcePanel({
  models, maxModels, maxDetails = 3,
  onUpdateModel, onAddModel, onRemoveModel,
  onUploadModelField, onUploadModelDetail, onRemoveModelDetail,
  onLoadInfluencerAt,
  referenceImage, onReferenceUpload,
  cloudReady, cloudInfluencers, onSaveInfluencer, onDeleteInfluencer,
}) {
  const [pickerOpenAt, setPickerOpenAt] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [savingForIndex, setSavingForIndex] = useState(null)

  const handlePickProfile = async (inf) => {
    if (pickerOpenAt === null) return
    await onLoadInfluencerAt(pickerOpenAt, inf)
    setPickerOpenAt(null)
  }

  const handleSaveFaceProfile = async (index) => {
    const face = models[index]?.face
    if (!face || !profileName.trim()) return
    setSavingProfile(true)
    try {
      await onSaveInfluencer({ name: profileName.trim(), faceDataUrl: face })
      setProfileName('')
      setSavingForIndex(null)
    } catch {} finally { setSavingProfile(false) }
  }

  const canAddMore = models.length < maxModels

  return (
    <div className="lg:flex-[2] flex-1 lg:min-w-[400px] flex flex-col h-full bg-white border-r border-[#EAEAEA] shrink-0 relative">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar flex flex-col gap-3">

        <div className="flex items-center justify-between sticky top-0 bg-white z-10 -mx-4 px-4 sm:-mx-5 sm:px-5 -mt-4 pt-4 sm:-mt-5 sm:pt-5 pb-2 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center">1</div>
            <h2 className="text-sm font-semibold text-ink">소스 업로드</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-[11px] font-semibold text-ink-soft tabular-nums">{models.length}명</span>
            {models.length > 1 && <span className="text-[10px] text-accent font-bold">· 그룹</span>}
          </div>
        </div>

        {/* ── Per-model outfit cards (compact) ────── */}
        <div className="flex flex-col gap-2">
          {models.map((model, i) => (
            <ModelCard
              key={i}
              index={i}
              model={model}
              isOnly={models.length === 1}
              maxDetails={maxDetails}
              onUpdate={(patch) => onUpdateModel(i, patch)}
              onRemove={() => onRemoveModel(i)}
              onUploadFace={onUploadModelField(i, 'face')}
              onUploadSponsor={onUploadModelField(i, 'sponsor')}
              onUploadDetail={onUploadModelDetail(i)}
              onRemoveDetail={(di) => onRemoveModelDetail(i, di)}
              onOpenFacePicker={() => setPickerOpenAt(i)}
              cloudReady={cloudReady}
              isSavingProfile={savingForIndex === i}
              onStartSaveProfile={() => { setSavingForIndex(i); setProfileName('') }}
              onCancelSaveProfile={() => { setSavingForIndex(null); setProfileName('') }}
              profileName={profileName}
              onProfileNameChange={setProfileName}
              onConfirmSaveProfile={() => handleSaveFaceProfile(i)}
              savingProfile={savingProfile}
            />
          ))}
        </div>

        {canAddMore && (
          <button
            onClick={onAddModel}
            className="w-full py-2 border border-dashed border-[#D4D4D4] rounded-lg hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-center gap-1.5 text-ink-muted hover:text-accent text-[11px] font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5" /> 인물 + 옷 추가 ({models.length}/{maxModels})
          </button>
        )}

        {/* ── Scene reference ──────────────────────── */}
        <div className="pt-2">
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> 씬 참고 (선택)
          </label>
          <ImageDropzone
            onUpload={onReferenceUpload} image={referenceImage}
            placeholder="포즈·무드·배경 참고"
            icon={ImageIcon}
            className="min-h-[180px] max-h-[480px] bg-canvas-sunken"
            fitMode="contain"
          />
          {referenceImage && (
            <p className="text-[10px] text-accent mt-1.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 포즈에서 '씬 참고 그대로' 사용 가능
            </p>
          )}
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-lg p-2.5 flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" strokeWidth={2} />
          <p className="text-[10px] text-accent font-medium leading-relaxed">
            각 인물은 자신이 매칭된 옷을 입고 한 장면에 자연스럽게 등장합니다.
          </p>
        </div>
      </div>

      {pickerOpenAt !== null && (
        <ProfilePicker
          seedProfiles={SEED_INFLUENCERS}
          cloudProfiles={cloudReady ? cloudInfluencers : []}
          cloudReady={cloudReady}
          slotIndex={pickerOpenAt}
          onPick={handlePickProfile}
          onUpload={(file) => { onUploadModelField(pickerOpenAt, 'face')(file); setPickerOpenAt(null) }}
          onDeleteCloud={onDeleteInfluencer}
          onClose={() => setPickerOpenAt(null)}
        />
      )}
    </div>
  )
}

function ModelCard({
  index, model, isOnly, maxDetails, onUpdate, onRemove,
  onUploadFace, onUploadSponsor, onUploadDetail, onRemoveDetail,
  onOpenFacePicker,
  cloudReady, isSavingProfile, onStartSaveProfile, onCancelSaveProfile,
  profileName, onProfileNameChange, onConfirmSaveProfile, savingProfile,
}) {
  const detailInputRef = useRef(null)
  const sponsorInputRef = useRef(null)
  const [draggingTarget, setDraggingTarget] = useState(null) // 'face' | 'sponsor' | 'details' | null

  const handleDetailDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDraggingTarget(null)
    const files = Array.from(e.dataTransfer.files).slice(0, maxDetails - model.details.length)
    files.forEach(onUploadDetail)
  }

  const makeDragHandlers = (target, onFile) => ({
    onDragEnter: (e) => { e.preventDefault(); e.stopPropagation(); setDraggingTarget(target) },
    onDragLeave: (e) => { e.preventDefault(); e.stopPropagation(); setDraggingTarget(null) },
    onDragOver:  (e) => { e.preventDefault(); e.stopPropagation(); if (draggingTarget !== target) setDraggingTarget(target) },
    onDrop: (e) => {
      e.preventDefault(); e.stopPropagation(); setDraggingTarget(null)
      const file = e.dataTransfer.files?.[0]
      if (file) onFile(file)
    },
  })

  const ready = model.face && model.sponsor

  return (
    <div className={`rounded-lg border bg-white overflow-hidden transition-all ${ready ? 'border-[#E5E5E5]' : 'border-[#FFE4B0] bg-[#FFFBF0]'}`}>
      <div className="p-3">
        {/* Top row: index + Face/Sponsor large + icons */}
        <div className="flex items-start gap-3">
          {/* Index chip */}
          <div className="w-6 h-6 rounded-md bg-ink text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-1">{index + 1}</div>

          {/* Face — 2x size, drag-drop or click-to-pick */}
          <div
            {...makeDragHandlers('face', onUploadFace)}
            className={`w-24 h-24 rounded-lg overflow-hidden shrink-0 relative group transition-all border-2 cursor-pointer ${
              draggingTarget === 'face'
                ? 'border-accent bg-accent/10'
                : model.face
                  ? 'border-[#E5E5E5] hover:border-ink shadow-studio'
                  : 'border-dashed border-[#D4D4D4] hover:border-ink bg-canvas-sunken'
            }`}
            onClick={onOpenFacePicker}
            title="클릭: 프로필 선택 / 드래그: 새 파일 업로드"
          >
            {model.face ? (
              <img src={model.face} className="w-full h-full object-cover pointer-events-none" alt={`Face ${index + 1}`} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-muted/60 pointer-events-none">
                <UserSquare2 className="w-7 h-7" strokeWidth={1.5} />
                <span className="text-[9px] font-semibold">{draggingTarget === 'face' ? '놓으세요' : '얼굴'}</span>
              </div>
            )}
            {model.face && draggingTarget !== 'face' && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                <span className="text-white text-[10px] font-bold">클릭/드래그</span>
              </div>
            )}
            {draggingTarget === 'face' && (
              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center pointer-events-none">
                <span className="bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full">놓으세요</span>
              </div>
            )}
          </div>

          {/* Sponsor — 2x size, drag-drop or click */}
          <div
            {...makeDragHandlers('sponsor', onUploadSponsor)}
            className={`w-24 h-24 rounded-lg overflow-hidden shrink-0 relative group transition-all border-2 cursor-pointer ${
              draggingTarget === 'sponsor'
                ? 'border-accent bg-accent/10'
                : model.sponsor
                  ? 'border-[#E5E5E5] hover:border-ink shadow-studio'
                  : 'border-dashed border-[#D4D4D4] hover:border-ink bg-canvas-sunken'
            }`}
            onClick={() => sponsorInputRef.current?.click()}
            title="클릭: 파일 선택 / 드래그: 새 파일 업로드"
          >
            {model.sponsor ? (
              <img src={model.sponsor} className="w-full h-full object-contain p-1.5 bg-canvas-sunken pointer-events-none" alt={`Item ${index + 1}`} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-muted/60 pointer-events-none">
                <Shirt className="w-7 h-7" strokeWidth={1.5} />
                <span className="text-[9px] font-semibold">{draggingTarget === 'sponsor' ? '놓으세요' : '옷'}</span>
              </div>
            )}
            {model.sponsor && draggingTarget !== 'sponsor' && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                <span className="text-white text-[10px] font-bold">클릭/드래그</span>
              </div>
            )}
            {draggingTarget === 'sponsor' && (
              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center pointer-events-none">
                <span className="bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full">놓으세요</span>
              </div>
            )}
            <input
              ref={sponsorInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadSponsor(f); e.target.value = '' }}
            />
          </div>

          {/* Action icons — vertical stack on the right */}
          <div className="flex flex-col gap-1 ml-auto">
            {cloudReady && model.face && !isSavingProfile && (
              <button
                onClick={onStartSaveProfile}
                className="p-1.5 text-ink-muted hover:text-accent transition-colors"
                title="이 얼굴을 내 프로필로 저장"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            )}
            {!isOnly && (
              <button
                onClick={() => { if (confirm(`인물 ${index + 1} 제거?`)) onRemove() }}
                className="p-1.5 text-ink-muted hover:text-red-500 transition-colors"
                title="이 인물 제거"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: category pills + detail strip */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex gap-1 shrink-0">
            {ITEM_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => onUpdate({ category: c.id })}
                className={`py-1 px-2 text-[10px] font-semibold rounded transition-all ${
                  model.category === c.id ? 'bg-ink text-white' : 'bg-canvas-sunken text-ink-muted hover:text-ink border border-[#E5E5E5]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Detail strip — drag-drop here too */}
          <div
            className={`flex-1 flex items-center gap-1.5 min-w-0 pl-2 border-l rounded-r transition-colors ${
              draggingTarget === 'details' ? 'bg-accent/10 border-accent border' : 'border-[#EAEAEA]'
            }`}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (model.details.length < maxDetails) setDraggingTarget('details') }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingTarget(null) }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={handleDetailDrop}
          >
            <span className="text-[9px] text-ink-muted shrink-0 font-semibold uppercase tracking-wider">디테일</span>
            <div className="flex gap-1 flex-wrap min-w-0">
              {model.details.map((d, di) => (
                <div key={di} className="w-12 h-12 shrink-0 relative rounded overflow-hidden border border-[#E5E5E5] group/d shadow-studio">
                  <img src={d} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={() => onRemoveDetail(di)}
                    className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover/d:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {model.details.length < maxDetails && (
                <button
                  onClick={() => detailInputRef.current?.click()}
                  className="w-12 h-12 shrink-0 border border-dashed border-[#D4D4D4] rounded flex items-center justify-center hover:bg-canvas-sunken hover:border-ink text-ink-muted"
                >
                  <Plus className="w-4 h-4" />
                  <input
                    ref={detailInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files).slice(0, maxDetails - model.details.length)
                      files.forEach(onUploadDetail); e.target.value = ''
                    }}
                  />
                </button>
              )}
            </div>
            <span className="text-[9px] text-ink-muted/60 ml-auto self-center tabular-nums shrink-0">{model.details.length}/{maxDetails}</span>
          </div>
        </div>
      </div>

      {/* Inline save profile form (expands when active) */}
      {isSavingProfile && (
        <div className="px-2 pb-2 flex gap-1.5 animate-fade-in border-t border-[#EAEAEA] pt-2">
          <input
            type="text" value={profileName}
            onChange={(e) => onProfileNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmSaveProfile()}
            placeholder={`인물 ${index + 1} 프로필 이름`} autoFocus
            className="flex-1 px-2 py-1 text-[11px] border border-[#E5E5E5] rounded bg-white outline-none focus:border-ink"
          />
          <button
            onClick={onConfirmSaveProfile} disabled={savingProfile || !profileName.trim()}
            className="px-2 py-1 text-[10px] font-semibold bg-ink text-white rounded hover:bg-ink-soft disabled:opacity-50 flex items-center gap-1"
          >
            {savingProfile ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />} 저장
          </button>
          <button onClick={onCancelSaveProfile} className="p-1 text-ink-muted hover:text-ink">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Incomplete hint */}
      {!ready && (
        <div className="px-2 pb-1.5 text-[9px] text-amber-700 font-medium">
          {!model.face && !model.sponsor && '얼굴·옷 모두 필요'}
          {!model.face && model.sponsor && '얼굴 추가 필요'}
          {model.face && !model.sponsor && '옷 업로드 필요'}
        </div>
      )}
    </div>
  )
}

function ProfilePicker({ seedProfiles, cloudProfiles, cloudReady, slotIndex, onPick, onUpload, onDeleteCloud, onClose }) {
  const fileInputRef = useRef(null)

  return (
    <div className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-studio-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]">
          <h3 className="text-sm font-semibold text-ink">인물 {slotIndex + 1} 얼굴 선택</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
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

          {cloudReady && (
            <div>
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">내가 저장한 프로필</span>
              {cloudProfiles.length === 0 ? (
                <p className="text-[11px] text-ink-muted/70 italic py-3">없음 — 모델 얼굴을 슬롯에 올린 후 디스켓 아이콘으로 저장하세요.</p>
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
            <img src={inf.faceUrl} className="w-full h-full object-cover" alt={inf.name} onError={(e) => { e.target.style.display = 'none' }} />
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
