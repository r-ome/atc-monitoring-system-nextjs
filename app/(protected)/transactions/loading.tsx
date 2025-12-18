export default function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-[420px] w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}
