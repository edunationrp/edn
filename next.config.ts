import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

function getSupabaseHostname() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) return undefined
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

const supabaseHostname = getSupabaseHostname()

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  images: supabaseHostname
    ? {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ],
      }
    : undefined,
}

export default nextConfig
