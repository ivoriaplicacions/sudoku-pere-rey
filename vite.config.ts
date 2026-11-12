import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The app loads nothing from outside its own bundle, and the policy says so.
 *
 * - style-src keeps 'unsafe-inline' because React and canvas-confetti set inline styles.
 * - worker-src allows blob: because canvas-confetti runs its animation in a blob worker.
 * - Links to the legal pages are navigations, which this policy does not restrict.
 *
 * Injected at build time only: the dev server needs an inline script for hot reload.
 * It goes right after the charset so it stays below the bridge script that Capacitor
 * injects at the top of <head> on older Android WebViews; a <meta> policy does not
 * apply to what comes before it.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const contentSecurityPolicy = (): Plugin => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml(html) {
    const charset = '<meta charset="UTF-8" />'
    if (!html.includes(charset)) {
      throw new Error('index.html: charset meta not found, the CSP has nowhere to go')
    }
    return html.replace(
      charset,
      `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`,
    )
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  test: {
    // Persistence and entitlements both go through localStorage.
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
