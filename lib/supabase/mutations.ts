/**
 * Helper pour les mutations Supabase côté client.
 * Contourne les limites de l'inférence de types sur les tables non-générées.
 */
import { createClient } from './client'

type InsertResult<T> = {
  data: T[] | null
  error: { message: string } | null
}

export async function insertRecord<T = Record<string, unknown>>(
  table: string,
  record: Record<string, unknown>,
  select?: string
): Promise<InsertResult<T>> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from(table).insert(record)
  if (select) {
    query = query.select(select).limit(1)
  }
  const { data, error } = await query
  return { data: data as T[] | null, error }
}

export async function upsertRecord(
  table: string,
  record: Record<string, unknown>
): Promise<{ error: { message: string } | null }> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from(table).upsert(record)
  return { error }
}

export async function updateRecord(
  table: string,
  updates: Record<string, unknown>,
  match: Record<string, unknown>
): Promise<{ error: { message: string } | null }> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from(table).update(updates)
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value)
  }
  const { error } = await query
  return { error }
}
