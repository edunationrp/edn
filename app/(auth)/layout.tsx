export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-br from-[#1B3A6B] via-[#1e4080] to-[#152F58]">
      <div className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-[#7AB832]/15" />
      <div className="pointer-events-none fixed -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#7AB832]/10" />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 sm:py-6">
        <div className="flex w-full max-w-md min-h-0 shrink-0 flex-col">
          <div className="overflow-hidden rounded-2xl bg-white p-5 shadow-2xl sm:p-6">{children}</div>
        </div>

        <p className="mt-3 shrink-0 text-center text-[11px] text-white/35">
          © {new Date().getFullYear()} EduNation · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
