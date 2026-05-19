declare const process: {
  env: Record<string, string | undefined>;
};

export const ELEVENLABS_DEFAULT_VOICE_NAME = 'Sam - Soft, Slightly Welsh and Friendly';
export const FALLBACK_ELEVENLABS_DEFAULT_VOICE_ID = 'DikmR0aoFXAp1A3NcovW';

export type ElevenLabsTransformConfig = {
  apiKey: string;
  defaultVoiceId: string;
};

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: { ok: boolean; error?: string; voiceId?: string; voiceName?: string }) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

export default function handler(_request: ApiRequest, response: ApiResponse) {
  const config = getElevenLabsTransformConfig();
  response.setHeader('Allow', 'POST');
  return response.status(501).json({
    ok: false,
    error: 'ElevenLabs transformation is not automated yet.',
    voiceId: config.defaultVoiceId,
    voiceName: ELEVENLABS_DEFAULT_VOICE_NAME
  });
}

export function getElevenLabsTransformConfig(env: Record<string, string | undefined> = process.env): ElevenLabsTransformConfig {
  return {
    apiKey: env.ELEVENLABS_API_KEY ?? '',
    defaultVoiceId: env.ELEVENLABS_DEFAULT_VOICE_ID ?? FALLBACK_ELEVENLABS_DEFAULT_VOICE_ID
  };
}

export async function transformAzureMp3WithElevenLabs(_azureMp3: Uint8Array, _config = getElevenLabsTransformConfig()): Promise<Uint8Array> {
  // TODO: Wire the experimental Azure -> ElevenLabs speech-to-speech call once the manual quality loop settles.
  // Azure remains the pronunciation source of truth; ElevenLabs is only a voice-quality transformation layer.
  throw new Error('ElevenLabs transformation is not automated yet.');
}
