import { Skeleton } from "@/components/Skeleton";

export default function LandingLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-14 w-[500px] mx-auto" />
          <Skeleton className="h-5 w-[400px] mx-auto" />
          <div className="flex justify-center gap-3">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
