type Props = Record<string, unknown>

// Accède à l'instance posthog déjà initialisée via window.posthog.
// Aucun import de posthog-js — zéro coût bundle sur les shared chunks.
function ph() {
  if (typeof window === 'undefined') return null
  return (window as any).posthog ?? null
}

export function captureEvent(event: string, props?: Props) {
  ph()?.capture(event, props)
}

export function identifyUser(userId: string, props?: Props) {
  ph()?.identify(userId, props)
}

export function resetAnalytics() {
  ph()?.reset()
}

export function captureException(error: unknown, props?: Props) {
  ph()?.captureException(error, props)
}
