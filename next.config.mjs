/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: pure client-side app (no API routes/server features),
  // so it deploys to any static host: Cloudflare Pages, Netlify, GitHub Pages.
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig