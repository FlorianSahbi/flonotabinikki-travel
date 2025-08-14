export function supportsViewTransitions() {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

type PushLike = (href: string) => void

export function pushWithViewTransition(push: PushLike, href: string) {
  if (!supportsViewTransitions()) {
    push(href)
    return
  }
  // @ts-expect-error experimental API
  document.startViewTransition(() => push(href))
}
