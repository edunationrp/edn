export const PARENT_ACTIVE_CHILD_COOKIE = 'parent_active_student_id'

export const PARENT_ACTIVE_CHILD_COOKIE_OPTIONS = {
  path: '/parent',
  maxAge: 60 * 60 * 24 * 90,
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
}
