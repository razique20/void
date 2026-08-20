import { Skeleton } from "@/components/Skeleton";

export default function LeadsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 md:px-12 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3 border-b border-foreground/[0.06] dark:border-white/[0.06] pb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-72" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      {/* Filter Bar */}
      <Skeleton className="h-11 w-full rounded-xl" />

      {/* Leads Table */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
