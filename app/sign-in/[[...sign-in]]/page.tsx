import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <SignIn 
        appearance={{
          baseTheme: dark,
          elements: {
            formButtonPrimary: "apple-button text-sm w-full",
            card: "bg-[#1d1d1f] border border-white/5 rounded-[28px] shadow-2xl",
            headerTitle: "text-white text-2xl font-bold tracking-tight",
            headerSubtitle: "text-[#86868b]",
            socialButtonsBlockButton: "bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors",
            formFieldLabel: "text-[#86868b] text-[12px] font-semibold uppercase tracking-wider",
            formFieldInput: "bg-black/50 border-white/10 text-white focus:border-white/30 transition-colors rounded-xl",
            footerActionText: "text-[#86868b]",
            footerActionLink: "text-white hover:underline",
            identityPreviewText: "text-white",
            identityPreviewEditButtonIcon: "text-white",
          }
        }} 
      />
    </div>
  );
}
