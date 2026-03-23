import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let loadingPromise = null;

function formatFfmpegTime(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

async function getFFmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

export async function trimVideoSegment(file, startTimeSec, endTimeSec, onProgress) {
  const start = Number(startTimeSec) || 0;
  const end = Number(endTimeSec) || 0;
  const duration = Math.max(0, end - start);

  if (duration <= 0) {
    throw new Error('Selected trim range is invalid.');
  }

  const ffmpeg = await getFFmpeg();
  ffmpeg.on('progress', ({ progress }) => {
    if (typeof onProgress === 'function') {
      onProgress(Math.round(progress * 100));
    }
  });

  const inputName = `input_${Date.now()}.mp4`;
  const outputName = `trimmed_${Date.now()}.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    '-ss',
    formatFfmpegTime(start),
    '-i',
    inputName,
    '-t',
    formatFfmpegTime(duration),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  const baseName = (file.name || 'audition').replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}_trimmed.mp4`, { type: 'video/mp4' });
}
