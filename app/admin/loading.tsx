export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-64 bg-bg-subtle border border-border-default rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-64 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
        <div className="lg:col-span-4 h-64 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
