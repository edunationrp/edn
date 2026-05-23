import { AuthHomeBackButton } from '@/components/auth/auth-home-back-button'

type AuthPageShellProps = {
  children: React.ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-gradient-to-br from-[#1B3A6B] via-[#1e4080] to-[#152F58]">
      <div className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-[#7AB832]/15" />
      <div className="pointer-events-none fixed -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#7AB832]/10" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex w-full max-w-sm flex-col">
          <AuthHomeBackButton className="mb-2" />
          <div className="auth-page-content rounded-xl bg-white p-4 shadow-xl sm:p-5 [&_input:not([type=checkbox]):not([type=radio])]:h-9 [&_input:not([type=checkbox]):not([type=radio])]:!text-base [&_select]:h-9 [&_select]:!text-base [&_textarea]:!text-base">
            {children}
          </div>
        </div>

        <p className="mt-4 shrink-0 text-center text-[11px] text-white/35">
          © {new Date().getFullYear()} EduNation · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
