import sSlug from '@sindresorhus/slugify'

/**
 * Consistent slug function for the whole project.
 * Behavior aligned with your previous implementation:
 * - lowercase
 * - remove diacritics (é→e, ñ→n…)
 * - replace non-alphanumeric chars with "-"
 * - trim leading/trailing "-"
 */
export function slugify(input: string) {
  return sSlug(input, {
    separator: '-',
    decamelize: false,
    preserveLeadingUnderscore: false,
    customReplacements: [['&', 'and']],
  })
}
