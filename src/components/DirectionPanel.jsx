import { Camera, Clock, Loader2, MapPin, Sun, Wand2 } from 'lucide-react'
import { ImageDropzone } from './ImageDropzone'
import { BG_TYPES, LIGHTING_OPTIONS, PRESETS, PROMPT_SNIPPETS, TIME_OPTIONS } from '../constants'

export function DirectionPanel({
  bgType, onBgTypeChange,
  selectedPreset, onPresetChange,
  customBgImage, onCustomBgUpload,
  timeOfDay, onTimeChange,
  lighting, onLightingChange,
  prompt, onPromptChange,
  isGenerating, canGenerate, onGenerate,
}) {
  return (
    <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col h-full bg-white border-r border-[#EAEAEA] shrink-0 relative">
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar flex flex-col gap-5 pb-28">

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center">2</div>
          <h2 className="text-sm font-semibold text-ink">환경 설정 및 디렉팅</h2>
        </div>

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

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#EAEAEA] bg-white/90 backdrop-blur-md">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className={`w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-studio ${isGenerating ? 'bg-accent/60 text-white cursor-wait' : canGenerate ? 'bg-ink text-white hover:bg-ink-soft active:scale-[0.99]' : 'bg-canvas-sunken text-ink-muted cursor-not-allowed'}`}
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 2장 동시 생성 중…</>
          ) : (
            <>새 게시물 만들기 <span className="text-[11px] opacity-60 font-medium">(2 컷)</span></>
          )}
        </button>
      </div>
    </div>
  )
}
