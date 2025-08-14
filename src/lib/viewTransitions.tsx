export function supportsViewTransitions() {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

/**
 * Lance une navigation avec View Transitions et retourne une Promise
 * résolue quand l'animation est terminée (ou immédiatement si non supporté).
 */
export function pushWithViewTransition(
  push: (href: string) => void,
  href: string
): Promise<void> {
  if (!supportsViewTransitions()) {
    push(href)
    return Promise.resolve()
  }
  const vt = (
    document as Document & {
      startViewTransition: (callback: () => void) => { finished: Promise<void> }
    }
  ).startViewTransition(() => {
    push(href)
  })
  // Certaines plateformes jettent; on ignore pour ne pas bloquer
  return vt.finished.catch(() => {})
}
