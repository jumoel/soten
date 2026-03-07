function Bar({ className }: { className?: string }) {
  return <div className={`h-3 rounded bg-gray-200 animate-pulse ${className ?? ""}`} />;
}

export function NoteCardSkeleton() {
  return (
    <div className="mt-1 space-y-2">
      <Bar className="w-3/4" />
      <Bar className="w-full" />
      <Bar className="w-5/6" />
    </div>
  );
}
