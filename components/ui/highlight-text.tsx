function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type Props = {
  text: string
  query: string
  className?: string
}

export function HighlightText({ text, query, className }: Props) {
  const trimmed = query.trim()
  if (!trimmed) {
    return <span className={className}>{text}</span>
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'gi'))

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={`${index}-${part}`}
            className="rounded bg-amber-200/90 px-0.5 font-semibold text-amber-950"
          >
            {part}
          </mark>
        ) : (
          <span key={`${index}-${part}`}>{part}</span>
        ),
      )}
    </span>
  )
}
