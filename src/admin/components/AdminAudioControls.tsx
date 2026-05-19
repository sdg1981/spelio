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

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <AdminButton onClick={() => {
          logAudioPlaybackClick(`${source}-azure-preview`, word.audioUrl);
          void playAudioUrl(word.audioUrl);
        }} disabled={!hasAzureAudio}>
          <Play size={15} /> Azure
        </AdminButton>
        <AudioDownloadLink word={word} audioUrl={word.audioUrl} label="Download Azure MP3" filenamePrefix="azure" />
      </div>
      <div className="flex flex-wrap gap-2">
        {hasElevenLabsAudio && (
          <>
            <AdminButton onClick={() => {
              logAudioPlaybackClick(`${source}-elevenlabs-preview`, word.elevenLabsAudioUrl);
              void playAudioUrl(word.elevenLabsAudioUrl);
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
