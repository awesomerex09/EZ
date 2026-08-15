import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

const inputDir = path.resolve('video-input');
const outputDir = path.resolve('public', 'sequence');
const inputPath = path.join(inputDir, 'source.mp4');
const fps = 30;

function startConversion() {
  if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true });
  }

  if (!fs.existsSync(inputPath)) {
    console.log(`File 'source.mp4' not found in '${inputDir}'.`);
    console.log('Please add the video file and try again.');
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Starting video parsing and conversion...");

  ffmpeg(inputPath)
    .outputOptions([
      '-f image2',
      '-c:v libwebp',
      '-qscale 50', 
      `-r ${fps}`,
    ])
    .output(path.join(outputDir, 'frame_%04d.webp'))
    .on('end', () => {
      console.log("Video successfully converted to WebP image sequence!");
    })
    .on('error', (err) => {
      console.error("Conversion failed:", err);
    })
    .on('progress', (progress) => {
      console.log(`Processing: ${progress.percent ? progress.percent.toFixed(2) + '%' : progress.frames + ' frames'}`);
    })
    .run();
}

startConversion();
