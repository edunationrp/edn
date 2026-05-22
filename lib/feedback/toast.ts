'use client'

import { toast } from 'sonner'
import { toUserMessage, type UserFeedback } from '@/lib/feedback/messages'

type ToastOptions = {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

function showSuccess(title: string, options?: ToastOptions) {
  toast.success(title, {
    description: options?.description,
    duration: options?.duration ?? 4500,
    action: options?.action,
  })
}

function showError(error: unknown, context?: string, options?: ToastOptions) {
  const { title, description } =
    typeof error === 'string' && !context
      ? { title: error, description: options?.description }
      : toUserMessage(error, context)
  toast.error(title, {
    description: options?.description ?? description,
    duration: options?.duration ?? 6500,
    action: options?.action,
  })
}

function showInfo(title: string, options?: ToastOptions) {
  toast.info(title, {
    description: options?.description,
    duration: options?.duration ?? 5000,
    action: options?.action,
  })
}

function showWarning(title: string, options?: ToastOptions) {
  toast.warning(title, {
    description: options?.description,
    duration: options?.duration ?? 5500,
    action: options?.action,
  })
}

function showLoading(title: string, options?: ToastOptions) {
  return toast.loading(title, {
    description: options?.description,
  })
}

function dismiss(id?: string | number) {
  toast.dismiss(id)
}

function fromFeedback(feedback: UserFeedback, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  if (type === 'success') {
    showSuccess(feedback.title, { description: feedback.description })
    return
  }
  if (type === 'error') {
    showError(feedback.title, undefined, { description: feedback.description })
    return
  }
  if (type === 'warning') {
    showWarning(feedback.title, { description: feedback.description })
    return
  }
  showInfo(feedback.title, { description: feedback.description })
}

export const notify = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  dismiss,
  fromFeedback,
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error?: string
    }
  ) =>
    toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error ?? 'Une erreur est survenue',
    }),
}
