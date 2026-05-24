export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[calc(100dvh-3.5rem)] overflow-hidden sm:h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-8rem)]">
      {children}
    </div>
  )
}
