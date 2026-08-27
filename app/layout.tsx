import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkThemeProvider } from "@/components/clerk-theme-provider";
import { DataProvider } from "@/lib/DataContext";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VOID — Hire an AI Workforce That Never Sleeps",
    template: "%s | VOID",
  },
  description:
    "Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7. Scale your team with intelligent agents that work globally, autonomously, and seamlessly.",
  keywords: [
    "AI agents",
    "AI workforce",
    "autonomous AI",
    "customer support AI",
    "sales automation",
    "AI chatbot",
    "AI customer service",
    "business automation",
    "AI agents",
    "deploy AI",
  ],
  authors: [{ name: "VOID" }],
  creator: "VOID",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://void.ai",
    siteName: "VOID",
    title: "VOID — Hire an AI Workforce That Never Sleeps",
    description:
      "Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "VOID — The Silent AI Workforce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOID — Hire an AI Workforce That Never Sleeps",
    description:
      "Deploy autonomous AI agents that handle support, sales, and customer workflows 24/7.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('color-theme') || 'slate';
                  document.documentElement.setAttribute('data-color-theme', theme);
                  
                  var collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
                  if (collapsed) {
                    document.documentElement.classList.add('sidebar-collapsed');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <ClerkThemeProvider>
            <DataProvider>
              <Navbar />
              <PageTransition>
                {children}
              </PageTransition>
            </DataProvider>
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
