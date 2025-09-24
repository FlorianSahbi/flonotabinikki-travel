// scripts/path-header.js
// ESM script (works with "type": "module").
// Adds/updates a single "// @path: <relative path>" as the FIRST line
// for every .ts/.tsx/.js/.jsx file under src/. Dedupes any other @path lines.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')
const TAG = '// @path:'
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const toPosix = (p) => p.split(path.sep).join(path.posix.sep)

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build', '.git'].includes(e.name))
        continue
      walk(p, out)
    } else if (e.isFile()) {
      out.push(p)
    }
  }
  return out
}

function processFile(absPath) {
  const ext = path.extname(absPath)
  if (!EXTS.has(ext)) return

  const rel = toPosix(path.relative(ROOT, absPath))
  if (!rel.startsWith('src/')) return

  const header = `${TAG} ${rel}`
  const raw = fs.readFileSync(absPath, 'utf8')
  const lines = raw.split(/\r?\n/)

  // Remove ALL existing @path lines anywhere in file
  const body = lines.filter((l) => !l.startsWith(TAG))

  // Recompose: first line = header, then the rest
  const next = [header, ...body].join('\n')

  if (next !== raw) {
    fs.writeFileSync(absPath, next, 'utf8')
  }
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('No src/ directory at project root.')
    process.exit(1)
  }
  const files = walk(SRC_DIR)
  for (const f of files) processFile(f)
}

main()
