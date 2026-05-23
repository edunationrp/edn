import { LogoSVG } from '@/components/brand/logo'

export default function RegisterSchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-br from-[#1B3A6B] via-[#1e4080] to-[#152F58]">
      <div className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-[#7AB832]/15" />
      <div className="pointer-events-none fixed -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#7AB832]/10" />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 sm:py-5">
        <div className="mb-4 shrink-0 text-center">
          <div className="inline-flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-xl">
              <LogoSVG width={32} height={32} />
              <div className="text-left">
                <div className="text-xl font-extrabold leading-none tracking-tight text-[#1B3A6B]">
                  Edu<span className="text-[#7AB832]">Nation</span>
                </div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                  Inscription établissement
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-2xl sm:p-6">{children}</div>
        </div>

        <p className="mt-3 shrink-0 text-center text-[11px] text-white/35">
          © {new Date().getFullYear()} EduNation · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
