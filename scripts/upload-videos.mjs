import { put } from '@vercel/blob'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_so1Q55lslWRYYqWT_nuTsM5I8eLXYZtUdof0TTIEW8wL0yW'

const videos = [
  {
    localPath: '/Users/vinodlakhani/Desktop/demo/capture-401k.mp4',
    blobName: 'videos/capture-401k.mp4',
  },
  {
    localPath: '/Users/vinodlakhani/Desktop/demo/increase-hsa.mp4',
    blobName: 'videos/increase-hsa.mp4',
  },
]

for (const video of videos) {
  console.log(`Uploading ${video.blobName}...`)
  const file = readFileSync(resolve(video.localPath))
  const blob = await put(video.blobName, file, {
    access: 'public',
    token: BLOB_READ_WRITE_TOKEN,
    contentType: 'video/mp4',
  })
  console.log(`✓ ${video.blobName}`)
  console.log(`  URL: ${blob.url}\n`)
}
