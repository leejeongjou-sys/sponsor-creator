import { useRef, useState } from 'react'

/**
 * Reusable image dropzone.
 *
 * @param fitMode 'cover' (default): image fills the box and crops to fit.
 *                'contain': image scales so its longest edge fits the box; whichever
 *                axis hits the box limit first stops, and the other axis stays
 *                proportional. Use for reference images where the whole frame matters.
 */
export function ImageDropzone({
  onUpload, image, placeholder, icon: Icon,
  className = '', imgClassName, fitMode = 'cover',
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrag = (e, state) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(state)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onUpload(file)
  }

  const resolvedImgClass = imgClassName
    ?? (fitMode === 'contain' ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover')

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => handleDrag(e, true)}
      onDragLeave={(e) => handleDrag(e, false)}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true) }}
      onDrop={handleDrop}
      className={`w-full border border-[#E5E5E5] rounded-lg cursor-pointer flex items-center justify-center relative overflow-hidden transition-all ${className} ${isDragging ? 'border-accent bg-accent/5' : image ? 'bg-white' : 'bg-canvas-sunken hover:bg-[#EFEFEC]'}`}
    >
      {image ? (
        <img src={image} className={`pointer-events-none ${resolvedImgClass}`} alt={placeholder} />
      ) : (
        <div className="text-center p-2 text-ink-muted pointer-events-none">
          <Icon className={`w-6 h-6 mx-auto mb-1.5 transition-colors ${isDragging ? 'text-accent' : 'text-ink-muted/50'}`} strokeWidth={1.5} />
          <p className={`font-semibold text-[11px] break-keep transition-colors ${isDragging ? 'text-accent' : 'text-ink-muted'}`}>
            {isDragging ? '여기에 놓으세요' : placeholder}
          </p>
        </div>
      )}
      {isDragging && image && (
        <div className="absolute inset-0 bg-accent/10 flex items-center justify-center backdrop-blur-[2px] pointer-events-none">
          <span className="bg-accent text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-studio-lg">이미지 교체</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onUpload(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
