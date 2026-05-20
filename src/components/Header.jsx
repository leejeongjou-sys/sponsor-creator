import { Key, Sparkles } from 'lucide-react'

export function Header({ apiKey, onApiKeyChange }) {
  return (
    <header className="h-14 px-4 sm:px-6 border-b border-[#EAEAEA] flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-20 sticky top-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full insta-gradient p-[1.5px] flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-pink-500" strokeWidth={2} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="display-serif italic text-xl tracking-tight text-ink leading-none">Sponsor Creator</h1>
          <span className="text-[10px] font-semibold text-ink-muted tracking-[0.12em] uppercase">Studio</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-canvas-sunken px-3 py-1.5 rounded-lg border border-transparent focus-within:border-[#DADADA] focus-within:bg-white transition-all">
        <Key className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.8} />
        <input
          type="password"
          value={apiKey || ''}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Gemini API Key"
          className="bg-transparent border-none outline-none text-xs w-32 sm:w-52 text-ink placeholder:text-ink-muted/60"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </header>
  )
}
