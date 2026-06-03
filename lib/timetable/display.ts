/** Affichage salle sans doublon « Salle SALLE 2 ». */
export function formatTimetableRoom(room: string | null | undefined): string | null {
  if (!room?.trim()) return null
  const trimmed = room.trim()
  if (/^salle\b/i.test(trimmed)) return trimmed
  return `Salle ${trimmed}`
}
