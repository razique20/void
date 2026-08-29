export default function SimpleLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gray-600 animate-spin" />
        </div>
        <p className="text-xs font-medium text-gray-400 tracking-wide">Loading…</p>
      </div>
    </div>
  );
}
