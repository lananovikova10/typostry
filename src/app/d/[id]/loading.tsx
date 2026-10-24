export default function DocumentLoading() {
  return (
    <div
      className="flex h-[480px] animate-pulse flex-col rounded-md border border-input"
      aria-busy="true"
      aria-label="Loading document"
    >
      <div className="h-12 border-b bg-secondary/40" />
      <div className="flex-1" />
    </div>
  )
}
