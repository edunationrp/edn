export function extractCourseResourceStoragePath(fileUrl: string): string | null {
  const markers = ['/course-resources/', 'course-resources/']
  for (const marker of markers) {
    const idx = fileUrl.indexOf(marker)
    if (idx !== -1) {
      return decodeURIComponent(fileUrl.slice(idx + marker.length).split('?')[0])
    }
  }
  return null
}
