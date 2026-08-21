import { Skeleton } from "@/components/Skeleton";

export default function TrainingLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3 border-b border-border-default pb-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3.5 w-80" />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Worker Selector + Content */}
        <div className="lg:col-span-8 space-y-5">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Right: Knowledge Base */}
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
