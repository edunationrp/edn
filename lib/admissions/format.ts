export function formatAdmissionTrackingRef(requestId: string) {
  return `ADM-${requestId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}
