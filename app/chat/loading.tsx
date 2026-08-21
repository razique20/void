import { Skeleton } from "@/components/Skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-full animate-in fade-in duration-300">
      {/* Sidebar: Worker List */}
      <div className="w-72 border-r border-border-default p-4 space-y-3 hidden md:block">
        <Skeleton className="h-10 w-full rounded-xl" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border-default px-6 flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <Skeleton className={`h-12 ${i % 2 === 0 ? "w-48" : "w-64"} rounded-2xl`} />
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-default">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
