import { Skeleton } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-in fade-in duration-300">
      {/* Sidebar */}
      <div className="hidden md:block space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>

      {/* Content */}
      <div className="md:col-span-3 space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
