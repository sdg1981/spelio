import { Play } from 'lucide-react';
import type { AdminWord } from '../types';
import { hasPlayableAudioUrl, logAudioPlaybackClick, playAudioUrl } from '../../lib/audioPlayback';
import { AudioDownloadLink } from './AudioDownloadLink';
import { AdminButton } from './primitives';

export function AdminAudioControls({
  word,
  source,
  className = ''
}: {
  word: AdminWord;
  source: string;
  className?: string;
}) {
  const hasAzureAudio = hasPlayableAudioUrl(word.audioUrl);
  const hasElevenLabsAudio = hasPlayableAudioUrl(word.elevenLabsAudioUrl);
  const azurePreviewUrl = withAdminPreviewCacheBust(word.audioUrl, word.updatedAt);
  const elevenLabsPreviewUrl = withAdminPreviewCacheBust(word.elevenLabsAudioUrl, word.elevenLabsGeneratedAt || word.updatedAt);

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <AdminButton onClick={() => {
          logAudioPlaybackClick(`${source}-azure-preview`, azurePreviewUrl);
          void playAudioUrl(azurePreviewUrl);
        }} disabled={!hasAzureAudio}>
          <Play size={15} /> Azure
        </AdminButton>
        <AudioDownloadLink word={word} audioUrl={word.audioUrl} label="Download Azure MP3" filenamePrefix="azure" />
      </div>
      <div className="flex flex-wrap gap-2">
        {hasElevenLabsAudio && (
          <>
            <AdminButton onClick={() => {
              logAudioPlaybackClick(`${source}-elevenlabs-preview`, elevenLabsPreviewUrl);
              void playAudioUrl(elevenLabsPreviewUrl);
            }}>
              <Play size={15} /> ElevenLabs
            </AdminButton>
            <AudioDownloadLink word={word} audioUrl={word.elevenLabsAudioUrl} label="Download ElevenLabs MP3" filenamePrefix="elevenlabs" />
          </>
        )}
      </div>
    </div>
  );
}

function withAdminPreviewCacheBust(audioUrl: string, updatedAt?: string) {
  const trimmed = audioUrl.trim();
  if (!trimmed || !updatedAt) return trimmed;
  const separator = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${separator}updated=${encodeURIComponent(updatedAt)}`;
}
