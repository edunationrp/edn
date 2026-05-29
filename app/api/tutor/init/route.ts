import { NextResponse } from 'next/server'
import { getTutorInitData } from '@/lib/eleve/tutor-data'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await getTutorInitData()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
