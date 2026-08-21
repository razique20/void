import { Skeleton } from "@/components/Skeleton";

export default function LiveLoading() {
  return (
    <div className="flex flex-1 overflow-hidden pt-20 animate-in fade-in duration-300">
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Dot grid & ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.04] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-apple-blue/[0.03] blur-[150px] rounded-full pointer-events-none" />

        <main className="flex-1 overflow-hidden relative z-10">
          <div className="h-full flex">

            {/* 1. Sidebar - Chat List */}
            <div className="w-80 flex flex-col bg-bg-subtle border-r border-border-default shrink-0">
              <div className="p-5 border-b border-border-default shrink-0 space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-2.5 w-48" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="flex-1 h-7 rounded-lg" />
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
                ))}
              </div>
            </div>

            {/* 2. Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="h-16 border-b border-border-default px-6 flex items-center gap-4 shrink-0 bg-background">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-8 w-32 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <Skeleton className={`h-12 ${i % 2 === 0 ? "w-48" : "w-64"} rounded-2xl`} />
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border-default bg-bg-subtle">
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>

            {/* 3. Right Drawer */}
            <div className="w-80 border-l border-border-default bg-bg-subtle p-5 space-y-5 shrink-0 hidden xl:block">
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-48" />
              </div>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-3 w-24" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
