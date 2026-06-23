// Chargement différé de PostHog — ne bloque pas le LCP/FCP.
// requestIdleCallback garantit que l'init s'exécute uniquement
// quand le navigateur est inactif, après le premier rendu.
export function register() {
  if (typeof window === 'undefined') return

  const init = async () => {
    const { default: posthog } = await import('posthog-js')
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/ingest',
      ui_host: 'https://eu.posthog.com',
      defaults: '2026-01-30',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === 'development',
    })
  }

  if ('requestIdleCallback' in window) {
    ;(window as any).requestIdleCallback(init)
  } else {
    setTimeout(init, 1000)
  }
}
