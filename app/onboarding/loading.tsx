import { Skeleton } from "@/components/Skeleton";

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-1.5 w-16 rounded-full" />
          ))}
        </div>

        {/* Form Card */}
        <div className="space-y-6 p-8 rounded-[28px] border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.008]">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-3.5 w-64 mx-auto" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
