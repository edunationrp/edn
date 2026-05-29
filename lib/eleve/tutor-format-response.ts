/**
 * Nettoie les réponses EduBot : texte lisible sans syntaxe Markdown.
 */
export function formatTutorResponse(text: string): string {
  let s = text.replace(/\r\n/g, '\n')

  // Titres ATX (# … ###)
  s = s.replace(/^#{1,6}\s+/gm, '')

  // Gras / italique (ordre : triple, double, simple)
  s = s.replace(/\*\*\*(.+?)\*\*\*/gs, '$1')
  s = s.replace(/\*\*(.+?)\*\*/gs, '$1')
  s = s.replace(/__(.+?)__/gs, '$1')
  s = s.replace(/\*(.+?)\*/gs, '$1')
  s = s.replace(/_(.+?)_/gs, '$1')

  // Listes markdown → puces françaises
  s = s.replace(/^\s*[-*+]\s+/gm, '   • ')

  // Liens [texte](url) → texte
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Code inline `...`
  s = s.replace(/`([^`]+)`/g, '$1')

  // Lignes vides excessives
  s = s.replace(/\n{3,}/g, '\n\n')

  // Espaces en fin de ligne
  s = s.replace(/[ \t]+$/gm, '')

  return s.trim()
}
