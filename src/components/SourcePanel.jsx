import { useRef, useState } from 'react'
import {
  CheckCircle2, Image as ImageIcon, Loader2, Lock, Plus, Save,
  Shirt, Trash2, UserPlus, UserSquare2, Users, X,
} from 'lucide-react'
import { ImageDropzone } from './ImageDropzone'
import { ITEM_CATEGORIES, SEED_INFLUENCERS, isSeedInfluencer } from '../constants'

export function SourcePanel({
  models, maxModels,
  onUpdateModel, onAddModel, onRemoveModel,
  onUploadModelField, onUploadModelDetail, onRemoveModelDetail,
  onLoadInfluencerAt,
  referenceImage, onReferenceUpload,
  cloudReady, cloudInfluencers, onSaveInfluencer, onDeleteInfluencer,
}) {
  const [pickerOpenAt, setPickerOpenAt] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [savingForIndex, setSavingForIndex] = useState(null) // index of model whose face we're saving

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
    <div className="flex-1 lg:min-w-[340px] flex flex-col h-full bg-white border-r border-[#EAEAEA] shrink-0 relative">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar flex flex-col gap-4">

        <div className="flex items-center justify-between">
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

        {/* ── Per-model outfit cards ───────────────── */}
        {models.map((model, i) => (
          <ModelCard
            key={i}
            index={i}
            model={model}
            isOnly={models.length === 1}
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

        {canAddMore && (
          <button
            onClick={onAddModel}
            className="w-full py-3 border border-dashed border-[#D4D4D4] rounded-lg hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-center gap-2 text-ink-muted hover:text-accent text-xs font-semibold"
          >
            <UserPlus className="w-4 h-4" /> 인물 + 옷 한 세트 추가 ({models.length}/{maxModels})
          </button>
        )}

        {/* ── Scene reference (shared across models) ──── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 block">씬 참고 (선택)</label>
          <ImageDropzone
            onUpload={onReferenceUpload} image={referenceImage}
            placeholder="포즈 / 무드 / 배경 참고"
            icon={ImageIcon} className="aspect-[4/2]"
          />
          <p className="text-[10px] text-ink-muted/70 mt-1.5 leading-relaxed">
            이 이미지는 <span className="font-semibold text-ink-soft">포즈와 분위기</span>의 가이드로 쓰입니다. 사람·옷은 위 모델 카드에서 1:1로 매칭됩니다.
          </p>
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-accent" strokeWidth={2} />
          <p className="text-[11px] text-accent font-medium leading-relaxed">
            각 인물은 자신이 매칭된 옷을 입은 채로 한 장면에 자연스럽게 등장합니다. 얼굴은 100% 일관되게 유지돼요.
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
  index, model, isOnly, onUpdate, onRemove,
  onUploadFace, onUploadSponsor, onUploadDetail, onRemoveDetail,
  onOpenFacePicker,
  cloudReady, isSavingProfile, onStartSaveProfile, onCancelSaveProfile,
  profileName, onProfileNameChange, onConfirmSaveProfile, savingProfile,
}) {
  const personLabel = index === 0 ? '메인 1' : `인물 ${index + 1}`
  const detailInputRef = useRef(null)

  const handleDetailMultiDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).slice(0, 5 - model.details.length)
    files.forEach(onUploadDetail)
  }

  return (
    <div className="border border-[#E5E5E5] rounded-xl bg-white overflow-hidden shadow-studio">
      {/* Header bar */}
      <div className="px-3 py-2 bg-canvas-sunken/60 border-b border-[#EAEAEA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
          <span className="text-[11px] font-semibold text-ink">{personLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          {ITEM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onUpdate({ category: cat.id })}
              className={`py-0.5 px-1.5 text-[10px] font-semibold rounded transition-all ${
                model.category === cat.id ? 'bg-ink text-white' : 'bg-white text-ink-muted hover:text-ink border border-[#E5E5E5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
          {!isOnly && (
            <button
              onClick={() => { if (confirm(`${personLabel} 제거?`)) onRemove() }}
              className="p-1 text-ink-muted/60 hover:text-red-500 transition-colors ml-1"
              title="이 인물 제거"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Face + Sponsor row */}
      <div className="grid grid-cols-2 gap-2 p-2.5">
        {/* Face */}
        <div className="relative">
          <button
            onClick={onOpenFacePicker}
            className={`w-full aspect-square rounded-lg bg-canvas-sunken overflow-hidden relative group transition-all border ${
              model.face ? 'border-[#E5E5E5] hover:border-ink' : 'border-dashed border-[#D4D4D4] hover:border-ink hover:bg-white'
            }`}
          >
            {model.face ? (
              <img src={model.face} className="w-full h-full object-cover" alt={`Face ${index + 1}`} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-muted">
                <UserSquare2 className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold">얼굴</span>
                <span className="text-[9px]">탭해서 선택</span>
              </div>
            )}
            {model.face && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-white text-[10px] font-semibold">변경</span>
              </div>
            )}
          </button>
        </div>

        {/* Sponsor item */}
        <ImageDropzone
          onUpload={onUploadSponsor}
          image={model.sponsor}
          placeholder="협찬 옷"
          icon={Shirt}
          className="aspect-square"
          imgClassName="object-contain p-2 bg-canvas-sunken"
        />
      </div>

      {/* Detail strip */}
      <div className="px-2.5 pb-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">옷 디테일 컷</span>
          <span className="text-[10px] text-ink-muted tabular-nums">{model.details.length} / 5</span>
        </div>
        <div
          className="flex flex-wrap gap-1.5 bg-canvas-sunken rounded-md p-1.5 border border-[#EAEAEA] min-h-[44px]"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
          onDrop={handleDetailMultiDrop}
        >
          {model.details.map((d, di) => (
            <div key={di} className="w-9 h-9 shrink-0 relative rounded overflow-hidden border border-[#E5E5E5] group">
              <img src={d} className="w-full h-full object-cover" alt={`Detail ${di}`} />
              <button
                onClick={() => onRemoveDetail(di)}
                className="absolute top-0 right-0 bg-black/70 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          {model.details.length < 5 && (
            <button
              onClick={() => detailInputRef.current?.click()}
              className="w-9 h-9 shrink-0 border border-dashed border-[#D4D4D4] rounded flex items-center justify-center cursor-pointer hover:bg-white hover:border-ink transition-colors text-ink-muted"
            >
              <Plus className="w-3 h-3" />
              <input
                ref={detailInputRef}
                type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files).slice(0, 5 - model.details.length)
                  files.forEach(onUploadDetail); e.target.value = ''
                }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Save profile inline (collapsed by default) */}
      {cloudReady && model.face && (
        <div className="px-2.5 pb-2.5 -mt-1">
          {!isSavingProfile ? (
            <button
              onClick={onStartSaveProfile}
              className="text-[10px] font-semibold text-accent hover:text-accent/80 flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> 이 얼굴을 내 프로필로 저장
            </button>
          ) : (
            <div className="flex gap-1.5 animate-fade-in">
              <input
                type="text" value={profileName}
                onChange={(e) => onProfileNameChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onConfirmSaveProfile()}
                placeholder="이름 (예: 모델 A)" autoFocus
                className="flex-1 px-2 py-1 text-[10px] border border-[#E5E5E5] rounded bg-white outline-none focus:border-ink"
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
          <h3 className="text-sm font-semibold text-ink">{slotIndex === 0 ? '메인' : `인물 ${slotIndex + 1}`} 얼굴 선택</h3>
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
