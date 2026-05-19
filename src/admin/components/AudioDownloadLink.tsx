import { Download } from 'lucide-react';
import { getPlayableAudioUrl } from '../../lib/audioPlayback';
import type { AdminWord } from '../types';

type AudioDownloadWord = Pick<AdminWord, 'audioUrl' | 'id' | 'listId' | 'welshAnswer'>;

export function AudioDownloadLink({
  word,
  className = '',
  label = 'Download MP3'
}: {
  word: AudioDownloadWord;
  className?: string;
  label?: string;
}) {
  const href = getPlayableAudioUrl(word.audioUrl);
  if (!href) return null;

  return (
    <a
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50 ${className}`}
      href={href}
      download={getAdminAudioDownloadFilename(word)}
      target="_blank"
      rel="noreferrer"
      onClick={event => event.stopPropagation()}
    >
      <Download size={15} />
      {label}
    </a>
  );
}

export function getAdminAudioDownloadFilename(word: Pick<AdminWord, 'id' | 'listId' | 'welshAnswer'>) {
  const parts = [word.listId, word.id, word.welshAnswer].map(sanitizeFilenamePart).filter(Boolean);
  return `${parts.join('_') || 'audio'}.mp3`;
}

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}._-]+/gu, '')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-');
}
