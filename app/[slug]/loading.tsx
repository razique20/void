import { Skeleton } from "@/components/Skeleton";

export default function SlugLoading() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-5 w-[500px]" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
