'use client';

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { motion, Variants } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export default function Page() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Background effects — matching landing page hero */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
          <div className="absolute inset-0 animate-[pulse_8s_ease-in-out_infinite]" style={{
            background: 'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(16, 185, 129, 0.10) 0%, transparent 70%)'
          }} />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/[0.07] blur-[150px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-400/[0.04] blur-[120px] rounded-full" />
        </div>

        {/* Grid pattern overlay — matching landing page */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-lg"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[0.2em] font-mono">
              System Online
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl font-black tracking-[-0.03em] text-white leading-[0.95] mb-6"
          >
            Welcome back to
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              VOID.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-white/50 text-lg leading-relaxed mb-12 max-w-md font-medium">
            Your AI workforce is waiting. Sign in to manage agents, review conversations, and monitor your dashboard.
          </motion.p>

          {/* Feature pills */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
            {["AI Agents", "Omnichannel", "Real-time Analytics"].map(
              (feature) => (
                <span
                  key={feature}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/30 bg-white/[0.03] border border-white/[0.06] px-4 py-2 rounded-full"
                >
                  {feature}
                </span>
              )
            )}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-8 left-12 right-12 z-10 text-[10px] font-bold text-white/15 uppercase tracking-widest">
          © 2026 VOID — All rights reserved
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }} />
        </div>

        <div className="relative z-10 w-full max-w-[400px]">
          {/* Mobile-only brand heading */}
          <div className="lg:hidden mb-8">
            <h1 className="text-3xl font-black tracking-[-0.03em] text-white mb-2">
              Welcome back
            </h1>
            <p className="text-white/40 text-sm">
              Sign in to your VOID dashboard.
            </p>
          </div>

          <SignIn
            appearance={{
              baseTheme: dark,
              elements: {
                formButtonPrimary:
                  "bg-white text-zinc-950 hover:bg-white/90 text-sm w-full font-bold transition-all shadow-lg shadow-white/5 cursor-pointer !rounded-none py-3",
                card: "bg-transparent border-0 shadow-none rounded-none p-0 w-full",
                headerTitle: "text-white text-xl font-bold tracking-tight",
                headerSubtitle: "text-white/40 text-sm",
                socialButtonsBlockButton:
                  "bg-white/[0.03] border border-white/[0.08] text-white hover:bg-white/[0.06] transition-all !rounded-none",
                socialButtonsBlockButtonText: "text-white/70 font-semibold text-sm",
                formFieldLabel:
                  "text-white/40 text-[11px] font-bold uppercase tracking-widest",
                formFieldInput:
                  "bg-white/[0.03] border border-white/[0.08] text-white focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all !rounded-none h-12",
                dividerLine: "bg-white/[0.06]",
                dividerText: "text-white/20 text-[10px] font-bold uppercase tracking-widest",
                footerActionText: "text-white/30 text-sm",
                footerActionLink:
                  "text-white hover:text-emerald-400 font-semibold transition-colors",
                identityPreviewText: "text-white",
                identityPreviewEditButtonIcon: "text-white",
                formFieldErrorText: "text-red-400 text-xs",
                alert: "bg-red-500/10 border border-red-500/20 text-red-400",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
