'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getFavoriteResourceIds,
  getViewedResourceIds,
  markResourceViewed,
  toggleFavoriteResource,
} from '@/lib/eleve/course-resource-preferences'

export function useCourseResourcePreferences() {
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setViewedIds(getViewedResourceIds())
    setFavoriteIds(getFavoriteResourceIds())
    setReady(true)
  }, [])

  const markViewed = useCallback((id: string) => {
    markResourceViewed(id)
    setViewedIds(prev => new Set([...prev, id]))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    const next = toggleFavoriteResource(id)
    setFavoriteIds(prev => {
      const copy = new Set(prev)
      if (next) copy.add(id)
      else copy.delete(id)
      return copy
    })
    return next
  }, [])

  return { viewedIds, favoriteIds, markViewed, toggleFavorite, ready }
}
