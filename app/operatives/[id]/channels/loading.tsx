import { Skeleton } from "@/components/Skeleton";

export default function ChannelsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Channel Cards */}
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-border-default bg-bg-subtle-alt space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <Skeleton className="h-12 w-40 rounded-xl" />
    </div>
  );
}
