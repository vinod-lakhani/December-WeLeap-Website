import { put } from '@vercel/blob'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_so1Q55lslWRYYqWT_nuTsM5I8eLXYZtUdof0TTIEW8wL0yW'

const videos = [
  { localPath: '/Users/vinodlakhani/Desktop/demo/pay-off-debt.mp4',       blobName: 'videos/pay-off-debt.mp4' },
  { localPath: '/Users/vinodlakhani/Desktop/demo/thumb-pay-off-debt.jpg', blobName: 'thumbnails/thumb-pay-off-debt.jpg' },
]

for (const video of videos) {
  console.log(`Uploading ${video.blobName}...`)
  const file = readFileSync(resolve(video.localPath))
  const blob = await put(video.blobName, file, {
    access: 'public',
    token: BLOB_READ_WRITE_TOKEN,
    contentType: video.blobName.endsWith('.jpg') ? 'image/jpeg' : 'video/mp4',
  })
  console.log(`✓ ${video.blobName}`)
  console.log(`  URL: ${blob.url}\n`)
}
