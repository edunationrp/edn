import type { NextConfig } from 'next'

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
