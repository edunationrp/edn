'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintReceiptButton() {
  return (
    <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
      <Printer className="mr-1 h-4 w-4" />
      Imprimer
    </Button>
  )
}
