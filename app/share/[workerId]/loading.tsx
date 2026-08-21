import { Skeleton } from "@/components/Skeleton";

export default function ShareLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg space-y-6">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </div>

        {/* Chat Preview */}
        <div className="space-y-4 p-6 rounded-2xl border border-border-default bg-bg-subtle-alt">
          {[1, 2].map((i) => (
            <div key={i} className={`flex ${i === 2 ? "justify-end" : "justify-start"}`}>
              <Skeleton className={`h-10 ${i === 2 ? "w-36" : "w-48"} rounded-2xl`} />
            </div>
          ))}
        </div>

        {/* Input */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
