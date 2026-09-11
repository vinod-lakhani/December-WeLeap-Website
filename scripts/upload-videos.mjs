/**
 * Upload a video and its thumbnail to the Vercel Blob store.
 *
 * Run manually, from a machine that has the files:
 *
 *   BLOB_READ_WRITE_TOKEN=… node scripts/upload-videos.mjs path/to/clip.mp4 path/to/thumb.jpg
 *
 * Nothing in the site imports @vercel/blob at runtime. app/early-access/videos
 * serves the results straight off their public blob URLs, which need no
 * credential — so this token exists only for the minute this script runs.
 *
 * The token used to be a literal on line 5 of this file, which put a live
 * read/write credential for the store into a public repository for four months.
 * Read it from the environment; never commit it. If Vercel's OIDC integration
 * is enabled for the store, `put` picks up short-lived credentials on its own
 * and the variable is not needed at all.
 */

import { put } from '@vercel/blob'
import { readFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

/** Videos and thumbnails live in their own prefixes in the store. */
const prefixFor = (ext) => (ext === '.mp4' || ext === '.webm' ? 'videos' : 'thumbnails')

const files = process.argv.slice(2)

if (files.length === 0) {
  console.error('Usage: node scripts/upload-videos.mjs <file> [file...]')
  console.error('Paths used to be hardcoded to one person\'s Desktop; pass them instead.')
  process.exit(1)
}

// Absent is fine when the store uses OIDC — the SDK resolves credentials
// itself. Only a hardcoded one is a problem.
const token = process.env.BLOB_READ_WRITE_TOKEN

for (const file of files) {
  const path = resolve(file)
  const ext = extname(path).toLowerCase()
  const contentType = CONTENT_TYPES[ext]

  if (!contentType) {
    console.error(`✗ ${basename(path)}: no content type known for "${ext}"`)
    process.exitCode = 1
    continue
  }

  const blobName = `${prefixFor(ext)}/${basename(path)}`
  console.log(`Uploading ${blobName}...`)

  const blob = await put(blobName, readFileSync(path), {
    access: 'public',
    contentType,
    ...(token ? { token } : {}),
  })

  console.log(`✓ ${blobName}`)
  console.log(`  URL: ${blob.url}\n`)
}
