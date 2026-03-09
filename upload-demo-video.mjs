import { storagePut } from './server/storage.ts';
import fs from 'fs';

async function uploadVideo() {
  try {
    const videoBuffer = fs.readFileSync('/home/ubuntu/storylingai/storylingai-demo-video.mp4');
    const result = await storagePut('demo/storylingai-demo-video.mp4', videoBuffer, 'video/mp4');
    console.log('✅ Video uploaded successfully!');
    console.log('URL:', result.url);
    fs.writeFileSync('/home/ubuntu/storylingai/demo-video-url.txt', result.url);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadVideo();
