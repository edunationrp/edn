import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export function ParentNoChildState({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Users className="h-10 w-10 text-[#1B3A6B]/40" />
          <div>
            <p className="font-medium text-gray-900">Aucun enfant sélectionné</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Rattachez un enfant pour accéder à cette section.
            </p>
          </div>
          <Button asChild className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90">
            <Link href="/parent/enfants">Gérer mes enfants</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
