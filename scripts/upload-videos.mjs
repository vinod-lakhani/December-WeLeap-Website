import { put } from '@vercel/blob'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_so1Q55lslWRYYqWT_nuTsM5I8eLXYZtUdof0TTIEW8wL0yW'

const videos = [
  { localPath: '/Users/vinodlakhani/Desktop/demo/thumb-onboarding.jpg',  blobName: 'thumbnails/thumb-onboarding.jpg' },
  { localPath: '/Users/vinodlakhani/Desktop/demo/thumb-set-my-plan.jpg', blobName: 'thumbnails/thumb-set-my-plan.jpg' },
  { localPath: '/Users/vinodlakhani/Desktop/demo/thumb-navigate-app.jpg',blobName: 'thumbnails/thumb-navigate-app.jpg' },
  { localPath: '/Users/vinodlakhani/Desktop/demo/thumb-capture-401k.jpg',blobName: 'thumbnails/thumb-capture-401k.jpg' },
  { localPath: '/Users/vinodlakhani/Desktop/demo/thumb-increase-hsa.jpg',blobName: 'thumbnails/thumb-increase-hsa.jpg' },
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
