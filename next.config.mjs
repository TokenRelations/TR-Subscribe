import { URL } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: buildRemotePatterns(),
  },
}

function buildRemotePatterns() {
  const origin = process.env.NEXT_PUBLIC_LOGO_CDN_ORIGIN?.trim()
  if (!origin) return []
  try {
    const u = new URL(origin.startsWith("http") ? origin : `https://${origin}`)
    const protocol = u.protocol.replace(":", "")
    if (protocol !== "http" && protocol !== "https") return []
    const pattern = {
      protocol,
      hostname: u.hostname,
      pathname: "/**",
    }
    if (u.port) Object.assign(pattern, { port: u.port })
    return [pattern]
  } catch {
    return []
  }
}

export default nextConfig
