/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance: Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    // Modern formats for better compression
    formats: ["image/avif", "image/webp"],
    // Limit device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Remote patterns (if needed for external images)
    remotePatterns: [],
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // XSS protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Permissions policy - restrict sensitive APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.github.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },

  // Logging and experimental features
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig
