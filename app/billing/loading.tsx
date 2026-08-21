import { Skeleton } from "@/components/Skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-8 font-sans antialiased animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-border-default pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>

      {/* Two-Column Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-bg-subtle border border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-56" />
            </div>
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>

          <div className="bg-bg-subtle border border-border-subtle rounded-2xl p-6 space-y-4">
            <Skeleton className="h-3 w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          <div className="bg-bg-subtle border border-border-subtle rounded-2xl p-8 min-h-[480px] space-y-6">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-4 w-full rounded" />
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-xl mt-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
