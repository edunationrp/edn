export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mt-5 -mb-4 h-[calc(100dvh-3.5rem)] overflow-hidden sm:-mx-0 sm:-mt-0 sm:-mb-0 sm:h-[calc(100dvh-8rem)] lg:mx-0 lg:mt-0 lg:mb-0 lg:h-[calc(100dvh-8rem)]">
      {children}
    </div>
  )
}
