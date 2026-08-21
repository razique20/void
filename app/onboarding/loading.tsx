import { Skeleton } from "@/components/Skeleton";

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-48 mx-auto rounded-lg" />
          <Skeleton className="h-3 w-64 mx-auto rounded-lg" />
        </div>

        {/* 3-step progress */}
        <div className="flex items-center justify-between px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-2 w-16 rounded-full" />
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="space-y-6 p-8 rounded-[28px] border border-border-default bg-bg-subtle-alt">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 mx-auto rounded-lg" />
            <Skeleton className="h-3.5 w-72 mx-auto rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
