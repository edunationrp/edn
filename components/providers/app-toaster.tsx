'use client'

import { Toaster } from 'sonner'

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand
      visibleToasts={4}
      duration={4500}
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl border shadow-lg font-sans text-sm !px-4 !py-3',
          title: 'font-semibold text-gray-900',
          description: 'text-gray-600 text-xs leading-relaxed',
          success: '!border-green-200 !bg-green-50',
          error: '!border-red-200 !bg-red-50',
          info: '!border-blue-200 !bg-blue-50',
          warning: '!border-amber-200 !bg-amber-50',
          closeButton: '!border-gray-200 !bg-white hover:!bg-gray-50',
        },
      }}
    />
  )
}
