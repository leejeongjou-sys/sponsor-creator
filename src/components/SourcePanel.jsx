import { CheckCircle2, Image as ImageIcon, Plus, Shirt, UserSquare2, X } from 'lucide-react'
import { ImageDropzone } from './ImageDropzone'
import { ITEM_CATEGORIES } from '../constants'

export function SourcePanel({
  sponsorImage, onSponsorUpload,
  detailImages, onDetailUpload, onDetailRemove,
  modelImage, onModelUpload,
  referenceImage, onReferenceUpload,
  itemCategory, onItemCategoryChange,
}) {
  const handleMultiDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).slice(0, 5 - detailImages.length)
    files.forEach(onDetailUpload)
  }

  return (
    <div className="flex-1 lg:min-w-[320px] flex flex-col h-full bg-white border-r border-[#EAEAEA] shrink-0">
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
                    id="upload-details"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files).slice(0, 5 - detailImages.length)
                      files.forEach(onDetailUpload)
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ImageDropzone onUpload={onModelUpload} image={modelImage} placeholder="인플루언서 (얼굴 고정)" icon={UserSquare2} className="aspect-square" />
          <ImageDropzone onUpload={onReferenceUpload} image={referenceImage} placeholder="포즈 / 무드 참고" icon={ImageIcon} className="aspect-square" />
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-accent" strokeWidth={2} />
          <p className="text-[11px] text-accent font-medium leading-relaxed">
            원본 인플루언서의 이목구비가 100% 일관되게 고정되어 자연스럽게 합성됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
