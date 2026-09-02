import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="flex flex-row-reverse min-h-screen bg-black">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center items-center p-12">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-emerald-500/[0.07] blur-[150px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/[0.04] blur-[100px] rounded-full" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[0.2em] font-mono">
              Free Tier Available
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-white leading-[1.1] mb-6">
            Deploy your first{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              AI agent.
            </span>
          </h1>

          <p className="text-white/40 text-base md:text-lg leading-relaxed mb-12 max-w-md">
            Start free. No credit card required. Your agent goes live in under 5 minutes across WhatsApp, Telegram, web chat, and email.
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {[
              { step: "01", text: "Describe what your agent should do" },
              { step: "02", text: "Upload your knowledge base" },
              { step: "03", text: "Go live across every channel" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <span className="text-[10px] font-black text-emerald-400/60 tabular-nums">
                  {item.step}
                </span>
                <div className="w-px h-6 bg-white/[0.06]" />
                <span className="text-sm text-white/40 font-medium">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-12 right-12 z-10 text-[10px] font-bold text-white/15 uppercase tracking-widest">
          © 2026 VOID — All rights reserved
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />

        <div className="relative z-10 w-full max-w-[400px]">
          {/* Mobile-only brand heading */}
          <div className="lg:hidden mb-8">
            <h1 className="text-3xl font-black tracking-[-0.03em] text-white mb-2">
              Get started free
            </h1>
            <p className="text-white/40 text-sm">
              Deploy your first AI agent in minutes.
            </p>
          </div>

          <SignUp
            appearance={{
              baseTheme: dark,
              elements: {
                formButtonPrimary:
                  "bg-white text-black hover:bg-white/90 text-sm w-full font-bold rounded-xl transition-all shadow-lg shadow-white/10 cursor-pointer",
                card: "bg-transparent border-0 shadow-none rounded-none p-0 w-full",
                headerTitle: "text-white text-xl font-bold tracking-tight",
                headerSubtitle: "text-white/40 text-sm",
                socialButtonsBlockButton:
                  "bg-white/[0.03] border border-white/[0.08] text-white hover:bg-white/[0.06] transition-all rounded-xl",
                socialButtonsBlockButtonText: "text-white/70 font-semibold text-sm",
                formFieldLabel:
                  "text-white/40 text-[11px] font-bold uppercase tracking-wider",
                formFieldInput:
                  "bg-white/[0.03] border border-white/[0.08] text-white focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all rounded-xl h-12",
                dividerLine: "bg-white/[0.06]",
                dividerText: "text-white/20 text-xs font-bold uppercase tracking-widest",
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
