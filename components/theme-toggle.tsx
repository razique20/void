"use client"

import * as React from "react"
import { Moon, Sun, Check, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

const COLOR_THEMES = [
  { id: 'slate', name: 'Slate Blue', color: '#0071e3', bg: 'bg-[#0071e3]' },
  { id: 'emerald', name: 'Emerald', color: '#10b981', bg: 'bg-[#10b981]' },
  { id: 'purple', name: 'Royal Velvet', color: '#8b5cf6', bg: 'bg-[#8b5cf6]' },
  { id: 'amber', name: 'Sunset Amber', color: '#f59e0b', bg: 'bg-[#f59e0b]' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState('slate')
  const popoverRef = React.useRef<HTMLDivElement>(null)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('color-theme') || 'slate'
    setColorTheme(saved)
  }, [])

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const selectColorTheme = (themeId: string) => {
    setColorTheme(themeId)
    localStorage.setItem('color-theme', themeId)
    document.documentElement.setAttribute('data-color-theme', themeId)
  }

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-card/50 border border-card-border" />
    )
  }

  const activePreset = COLOR_THEMES.find(t => t.id === colorTheme) || COLOR_THEMES[0]

  return (
    <div className="relative" ref={popoverRef}>
      {/* Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full glass glass-hover transition-all duration-300"
        aria-label="Customize interface theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Moon className="w-5 h-5 text-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Sun className="w-5 h-5 text-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small Active Color Indicator Badge */}
        <span 
          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-background shadow-sm"
          style={{ backgroundColor: activePreset.color }}
        />
      </button>

      {/* Sleek Customizer Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 p-5 rounded-[24px] popover-glass z-[200] space-y-5 [transform:translate3d(0,0,0)]"
          >
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-silver">
                Interface Visuals
              </h3>
            </div>

            {/* Section 1: Light / Dark Mode */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-silver uppercase tracking-wider block">Appearance</label>
              <div className="grid grid-cols-2 gap-2 bg-foreground/5 p-1 rounded-xl">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    theme === "light" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-silver hover:text-foreground"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    theme === "dark" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-silver hover:text-foreground"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </button>
              </div>
            </div>

            {/* Section 2: Color Palette Preset */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-silver uppercase tracking-wider block">Palette Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEMES.map((themeOption) => {
                  const isActive = colorTheme === themeOption.id
                  return (
                    <button
                      key={themeOption.id}
                      onClick={() => selectColorTheme(themeOption.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border text-xs font-semibold ${
                        isActive 
                          ? "bg-foreground/5 border-foreground/10 text-foreground" 
                          : "bg-transparent border-transparent text-silver hover:text-foreground hover:bg-foreground/[0.02]"
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: themeOption.color }}
                      >
                        {isActive && <Check className="w-2 h-2 text-white" />}
                      </span>
                      <span className="truncate">{themeOption.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

