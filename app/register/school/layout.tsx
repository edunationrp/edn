import { LogoSVG } from '@/components/brand/logo'

export default function RegisterSchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B3A6B] via-[#1e4080] to-[#152F58] flex items-center justify-center p-4 py-10">
      <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-[#7AB832]/15 pointer-events-none" />
      <div className="fixed -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#7AB832]/10 pointer-events-none" />

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-3">
              <LogoSVG width={36} height={36} />
              <div className="text-left">
                <div className="text-[#1B3A6B] font-extrabold text-2xl leading-none tracking-tight">
                  Edu<span className="text-[#7AB832]">Nation</span>
                </div>
                <div className="text-[#6B7280] text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5">
                  Inscription établissement
                </div>
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm">SaaS multi-établissements — Burkina Faso</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>

        <p className="text-center text-white/35 text-xs mt-6">
          © {new Date().getFullYear()} EduNation · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
