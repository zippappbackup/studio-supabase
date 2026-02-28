export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[9999]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
    </div>
  );
}
