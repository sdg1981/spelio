declare const process: {
  env: Record<string, string | undefined>;
};

import * as ffmpegStaticModule from 'ffmpeg-static';

type SpawnedProcess = {
  stdout?: { on: (event: 'data', listener: (chunk: unknown) => void) => void };
  stderr?: { on: (event: 'data', listener: (chunk: unknown) => void) => void };
  on: (event: 'error' | 'close', listener: (value: unknown) => void) => void;
};

type Spawn = (command: string, args: string[], options?: { stdio?: string[] }) => SpawnedProcess;
type FileSystemPromises = {
  mkdtemp: (prefix: string) => Promise<string>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  readFile: (path: string) => Promise<Uint8Array>;
  rm: (path: string, options: { recursive: boolean; force: boolean }) => Promise<void>;
};
type OsModule = {
  tmpdir: () => string;
};
type PathModule = {
  join: (...parts: string[]) => string;
};

type NodeAudioTools = {
  spawn: Spawn;
  fs: FileSystemPromises;
  os: OsModule;
  path: PathModule;
  ffmpegPath: string;
};

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
const bundledFfmpegPath = normalizeFfmpegStaticPath(ffmpegStaticModule);

export const AUDIO_POST_PROCESSING_MIN_BYTES = 100;
export const AUDIO_FADE_OUT_SECONDS = 0.03;
export const AUDIO_TRAILING_SILENCE_SECONDS = 0.15;
export const AUDIO_TRAILING_SILENCE_SAMPLES = 2400;
export const AUDIO_LOUDNESS_FILTER = 'loudnorm=I=-20:TP=-3:LRA=13:linear=true';
export const FINAL_MP3_BITRATE = '32k';
export const FINAL_MP3_SAMPLE_RATE = '16000';

export function createAudioPostProcessingFilter() {
  return [
    AUDIO_LOUDNESS_FILTER,
    'areverse',
    `afade=t=in:d=${AUDIO_FADE_OUT_SECONDS}`,
    'areverse',
    `apad=pad_len=${AUDIO_TRAILING_SILENCE_SAMPLES}`
  ].join(',');
}

export function createFfmpegPostProcessingArgs(inputPath: string, outputPath: string) {
  return [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    inputPath,
    '-af',
    createAudioPostProcessingFilter(),
    '-codec:a',
    'libmp3lame',
    '-b:a',
    FINAL_MP3_BITRATE,
    '-ar',
    FINAL_MP3_SAMPLE_RATE,
    '-ac',
    '1',
    outputPath
  ];
}

export async function postProcessAzureWavToMp3(wavAudio: ArrayBuffer | Uint8Array) {
  const tools = await loadNodeAudioTools();
  const tempDir = await tools.fs.mkdtemp(tools.path.join(tools.os.tmpdir(), 'spelio-audio-'));
  const inputPath = tools.path.join(tempDir, 'azure.wav');
  const outputPath = tools.path.join(tempDir, 'processed.mp3');

  try {
    await tools.fs.writeFile(inputPath, toUint8Array(wavAudio));
    await runFfmpeg(tools.spawn, tools.ffmpegPath, createFfmpegPostProcessingArgs(inputPath, outputPath));

    const processedAudio = await tools.fs.readFile(outputPath);
    if (processedAudio.byteLength < AUDIO_POST_PROCESSING_MIN_BYTES) {
      throw new Error('Processed audio payload was unexpectedly small.');
    }

    return processedAudio;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown audio processing error.';
    console.error('Audio post-processing failed', { error: message });
    throw new Error(`Audio post-processing failed: ${message}`);
  } finally {
    await tools.fs.rm(tempDir, { recursive: true, force: true }).catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Audio temp cleanup failed', { error: message });
    });
  }
}

async function loadNodeAudioTools(): Promise<NodeAudioTools> {
  const [childProcessModule, fsModule, osModule, pathModule] = await Promise.all([
    dynamicImport('node:child_process'),
    dynamicImport('node:fs/promises'),
    dynamicImport('node:os'),
    dynamicImport('node:path')
  ]);

  const fs = fsModule as FileSystemPromises;
  return {
    spawn: (childProcessModule as { spawn: Spawn }).spawn,
    fs,
    os: osModule as OsModule,
    path: pathModule as PathModule,
    ffmpegPath: await resolveFfmpegPath(fs)
  };
}

export async function resolveFfmpegPath(
  fs: Pick<FileSystemPromises, 'readFile'>,
  env: Record<string, string | undefined> = process.env,
  fallbackFfmpegPath: string | null = bundledFfmpegPath
) {
  if (env.FFMPEG_PATH) {
    await assertFileExists(fs, env.FFMPEG_PATH, 'FFMPEG_PATH');
    console.info('FFmpeg binary resolved', {
      source: 'FFMPEG_PATH',
      pathExists: true
    });
    return env.FFMPEG_PATH;
  }

  if (!fallbackFfmpegPath) throw new Error('Bundled FFmpeg package did not expose a binary path.');
  await assertFileExists(fs, fallbackFfmpegPath, 'ffmpeg-static');
  console.info('FFmpeg package resolved', {
    source: 'ffmpeg-static',
    pathExists: true
  });
  return fallbackFfmpegPath;
}

function normalizeFfmpegStaticPath(moduleValue: unknown): string | null {
  if (typeof moduleValue === 'string') return moduleValue;
  if (moduleValue && typeof moduleValue === 'object' && 'default' in moduleValue) {
    const defaultValue = (moduleValue as { default?: unknown }).default;
    return typeof defaultValue === 'string' ? defaultValue : null;
  }
  return null;
}

async function assertFileExists(fs: Pick<FileSystemPromises, 'readFile'>, filePath: string, source: string) {
  try {
    await fs.readFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`FFmpeg binary path from ${source} was not readable: ${message}`);
  }
}

function runFfmpeg(spawn: Spawn, ffmpegPath: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr?.on('data', chunk => {
      stderr += String(chunk);
    });

    child.on('error', error => {
      reject(error instanceof Error ? error : new Error(String(error)));
    });

    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`FFmpeg exited with code ${String(code)}${stderr ? `: ${stderr.trim()}` : ''}`));
    });
  });
}

function toUint8Array(audio: ArrayBuffer | Uint8Array) {
  return audio instanceof Uint8Array ? audio : new Uint8Array(audio);
}
