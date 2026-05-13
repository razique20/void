"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ClerkProvider
      appearance={{
        baseTheme: mounted && resolvedTheme === "dark" ? dark : dark, // Default to dark for VOID aesthetic
        variables: {
          colorPrimary: "#0071e3",
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
