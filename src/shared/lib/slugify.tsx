// @path: src/shared/lib/slugify.tsx
import sSlug from '@sindresorhus/slugify'

export function slugify(input: string) {
  return sSlug(input, {
    separator: '-',
    decamelize: false,
    preserveLeadingUnderscore: false,
    customReplacements: [['&', 'and']],
  })
}
