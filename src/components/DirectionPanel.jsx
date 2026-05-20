import { useState } from 'react'
import { Camera, Clock, Loader2, MapPin, RefreshCw, Sun, Wand2, X } from 'lucide-react'
import { ImageDropzone } from './ImageDropzone'
import {
  BG_TYPES, GENERATION_MODES, LIGHTING_OPTIONS, POSE_BY_ID,
  POSE_PRESETS, POSES_FOR_CATEGORY, POSES_FOR_GROUP,
  PRESETS, PROMPT_SNIPPETS, TIME_OPTIONS,
} from '../constants'

export function DirectionPanel({
  mode, onModeChange,
  selectedPoses, onSelectedPosesChange,
  sharedCategory,
  isGroup, modelCount,
  hasReferenceImage,
  bgType, onBgTypeChange,
  selectedPreset, onPresetChange,
  customBgImage, onCustomBgUpload,
  timeOfDay, onTimeChange,
  lighting, onLightingChange,
  prompt, onPromptChange,
  isGenerating, canGenerate, onGenerate,
}) {
  const [pickerOpenAt, setPickerOpenAt] = useState(null) // slot index being edited

  const handlePosePick = (poseId) => {
    if (pickerOpenAt === null) return
    onSelectedPosesChange(selectedPoses.map((p, i) => (i === pickerOpenAt ? poseId : p)))
    setPickerOpenAt(null)
  }

  // Pose pool selection logic:
  //   - Group (2+ models): always group-pose pool
  //   - Single model: filter by that model's category
  //   - Multiple models w/ DIFFERENT categories: no filter (any pose ok)
  //     This handles "model A wears top, model B wears bottom" gracefully.
  let availablePoseIds
  if (isGroup) availablePoseIds = POSES_FOR_GROUP
  else if (sharedCategory) availablePoseIds = POSES_FOR_CATEGORY[sharedCategory] || POSES_FOR_CATEGORY.top
  else availablePoseIds = POSE_PRESETS.map((p) => p.id) // mixed categories within group: show all
  const availablePoses = POSE_PRESETS.filter((p) => availablePoseIds.includes(p.id))

  return (
    <div className="w-full lg:flex-1 lg:min-w-[340px] flex flex-col h-full bg-white border-r border-[#EAEAEA] shrink-0 relative">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar flex flex-col gap-5 pb-28">

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center">2</div>
          <h2 className="text-sm font-semibold text-ink">환경 설정 및 디렉팅</h2>
        </div>

        {/* ── Mode toggle ───────────────────────────── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} /> 생성 모드
          </label>
          <div className="flex gap-1 bg-canvas-sunken p-1 rounded-lg">
            {GENERATION_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`flex-1 py-2 rounded-md transition-all ${mode === m.id ? 'bg-white shadow-studio' : 'hover:bg-white/40'}`}
              >
                <div className={`text-[12px] font-semibold ${mode === m.id ? 'text-ink' : 'text-ink-muted'}`}>{m.label}</div>
                <div className={`text-[10px] mt-0.5 ${mode === m.id ? 'text-ink-muted' : 'text-ink-muted/70'}`}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Pose slots ────────────────────────────── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            포즈 ({selectedPoses.length}컷) {isGroup && <span className="text-accent text-[10px] normal-case">· {modelCount}인 모드</span>}
          </label>
          <div className={`grid gap-2 ${selectedPoses.length === 2 ? 'grid-cols-2' : 'grid-cols-5'}`}>
            {selectedPoses.map((poseId, i) => {
              const pose = POSE_BY_ID[poseId]
              return (
                <button
                  key={`${i}-${poseId}`}
                  onClick={() => setPickerOpenAt(i)}
                  className="p-2 rounded-lg border border-[#E5E5E5] bg-white hover:border-ink hover:shadow-studio transition-all text-center group"
                >
                  <div className="text-xl leading-none mb-1">{pose?.emoji}</div>
                  <div className="text-[10px] font-semibold text-ink truncate">{pose?.label}</div>
                  <div className="text-[9px] text-ink-muted/70 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">변경</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Background ────────────────────────────── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" strokeWidth={2} /> 배경
          </label>
          <div className="flex gap-1 bg-canvas-sunken p-1 rounded-lg">
            {BG_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => onBgTypeChange(t.id)}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${bgType === t.id ? 'bg-white shadow-studio text-ink' : 'text-ink-muted hover:text-ink'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {bgType === 'preset' && (
          <div className="grid grid-cols-2 gap-2 animate-fade-in">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => onPresetChange(p.id)}
                className={`p-2.5 text-left rounded-lg border transition-all ${selectedPreset === p.id ? 'border-ink bg-ink text-white shadow-studio' : 'border-[#E5E5E5] bg-white hover:border-[#B5B5B5]'}`}
              >
                <div className="text-[12px] font-semibold truncate">{p.name}</div>
                <div className={`text-[10px] mt-0.5 truncate ${selectedPreset === p.id ? 'text-white/60' : 'text-ink-muted'}`}>{p.desc}</div>
              </button>
            ))}
          </div>
        )}
        {bgType === 'custom' && (
          <div className="animate-fade-in">
            <ImageDropzone onUpload={onCustomBgUpload} image={customBgImage} placeholder="배경 이미지 업로드" icon={Camera} className="h-32" />
          </div>
        )}
        {bgType === 'none' && (
          <div className="p-4 border border-dashed border-[#D4D4D4] bg-canvas-sunken rounded-lg text-center text-xs text-ink-muted font-medium animate-fade-in">
            업로드하신 <span className="font-semibold text-ink">포즈 / 무드 참고</span> 사진의<br />배경과 환경을 그대로 따라갑니다.
          </div>
        )}

        {/* ── Time ──────────────────────────────────── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} /> 시간대
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => onTimeChange(t.id)}
                className={`py-1.5 px-3 text-[11px] font-semibold rounded-full border transition-all ${timeOfDay === t.id ? 'border-ink bg-ink text-white' : 'border-[#E5E5E5] bg-white text-ink-soft hover:border-[#B5B5B5]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lighting ──────────────────────────────── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" strokeWidth={2} /> 조명
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LIGHTING_OPTIONS.map((l) => (
              <button
                key={l.id}
                onClick={() => onLightingChange(l.id)}
                className={`py-1.5 px-3 text-[11px] font-semibold rounded-full border transition-all ${lighting === l.id ? 'border-ink bg-ink text-white' : 'border-[#E5E5E5] bg-white text-ink-soft hover:border-[#B5B5B5]'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Free-form prompt ─────────────────────── */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" strokeWidth={2} /> 상세 디렉팅 노트
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {PROMPT_SNIPPETS.map((snippet) => (
              <button
                key={snippet}
                onClick={() => onPromptChange(prompt ? `${prompt}, ${snippet}` : snippet)}
                className="px-2.5 py-1 text-[10px] font-medium text-ink-soft bg-canvas-sunken border border-[#E5E5E5] rounded-md hover:bg-white hover:border-ink transition-all"
              >
                + {snippet}
              </button>
            ))}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="w-full h-24 p-3 bg-white border border-[#E5E5E5] rounded-lg text-sm outline-none focus:border-ink transition-colors resize-none placeholder:text-ink-muted/60"
            placeholder="추가 연출 사항 (예: 바람에 날리는 머릿결, 시크한 포즈)"
          />
        </div>
      </div>

      {/* ── Submit button ──────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#EAEAEA] bg-white/90 backdrop-blur-md">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className={`w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-studio ${isGenerating ? 'bg-accent/60 text-white cursor-wait' : canGenerate ? 'bg-ink text-white hover:bg-ink-soft active:scale-[0.99]' : 'bg-canvas-sunken text-ink-muted cursor-not-allowed'}`}
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {selectedPoses.length}컷 생성 중…</>
          ) : (
            <>새 게시물 만들기 <span className="text-[11px] opacity-60 font-medium">({selectedPoses.length} 컷)</span></>
          )}
        </button>
      </div>

      {/* ── Pose picker modal ──────────────────────── */}
      {pickerOpenAt !== null && (
        <PosePicker
          poses={availablePoses}
          currentId={selectedPoses[pickerOpenAt]}
          hasReferenceImage={hasReferenceImage}
          onPick={handlePosePick}
          onClose={() => setPickerOpenAt(null)}
        />
      )}
    </div>
  )
}

function PosePicker({ poses, currentId, hasReferenceImage, onPick, onClose }) {
  return (
    <div className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-studio-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]">
          <h3 className="text-sm font-semibold text-ink">포즈 선택</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 custom-scrollbar">
          {poses.map((p) => {
            const disabled = p.requiresReference && !hasReferenceImage
            return (
              <button
                key={p.id}
                onClick={() => !disabled && onPick(p.id)}
                disabled={disabled}
                title={disabled ? '씬 참고 이미지를 먼저 업로드해주세요' : undefined}
                className={`p-3 rounded-lg border transition-all text-center relative ${
                  disabled
                    ? 'border-[#E5E5E5] bg-canvas-sunken text-ink-muted cursor-not-allowed opacity-60'
                    : currentId === p.id
                      ? 'border-ink bg-ink text-white shadow-studio'
                      : 'border-[#E5E5E5] bg-white hover:border-ink hover:shadow-studio'
                }`}
              >
                <div className="text-2xl leading-none mb-1.5">{p.emoji}</div>
                <div className="text-[11px] font-semibold leading-tight">{p.label}</div>
                {p.requiresReference && (
                  <div className={`text-[9px] mt-0.5 font-medium ${disabled ? 'text-red-500' : currentId === p.id ? 'text-white/70' : 'text-accent'}`}>
                    {disabled ? '참고 필요' : '참고 사용'}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
