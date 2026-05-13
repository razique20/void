"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-card/50 border border-card-border" />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 flex items-center justify-center rounded-full glass glass-hover transition-all duration-300"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ y: 10, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -10, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-primary" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 10, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -10, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
