import { Skeleton } from "@/components/Skeleton";

export default function LiveLoading() {
  return (
    <div className="h-full w-full flex overflow-hidden animate-in fade-in duration-300">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 1. Sidebar - Chat List */}
      <div className="w-80 flex flex-col bg-foreground/[0.01] dark:bg-white/[0.005] border-r border-foreground/[0.06] dark:border-white/[0.06] shrink-0 backdrop-blur-md">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-foreground/[0.06] dark:border-white/[0.06] shrink-0 space-y-3.5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Chat Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-16 border-b border-foreground/[0.06] dark:border-white/[0.06] px-6 flex items-center gap-4 shrink-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <Skeleton className={`h-12 ${i % 2 === 0 ? "w-48" : "w-64"} rounded-2xl`} />
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-foreground/[0.06] dark:border-white/[0.06]">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* 3. Right Drawer */}
      <div className="w-80 border-l border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.01] dark:bg-white/[0.005] p-5 space-y-5 shrink-0 hidden xl:block">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-5 w-24" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
