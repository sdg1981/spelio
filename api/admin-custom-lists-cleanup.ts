declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

type SupabaseResult<T> = {
  data: T | null;
  error: unknown;
};

type SupabaseCleanupClient = {
  from: (table: string) => {
    select: (columns: string) => {
      lte: (column: string, value: string) => Promise<SupabaseResult<ExpiredCustomListRow[]>>;
    };
    delete: () => {
      lte: (column: string, value: string) => {
        select: (columns: string) => Promise<SupabaseResult<Array<{ id: string }>>>;
      };
    };
  };
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<SupabaseResult<unknown[]>>;
    };
  };
};

type SupabaseAuthClient = {
  auth: {
    getUser: (token: string) => Promise<{ data?: { user?: unknown }; error?: unknown }>;
  };
};

type HandlerDependencies = {
  env?: Record<string, string | undefined>;
  now?: () => Date;
  createAuthClient?: (env: Record<string, string | undefined>) => SupabaseAuthClient;
  createCleanupClient?: (env: Record<string, string | undefined>) => SupabaseCleanupClient;
};

type ExpiredCustomListRow = {
  id: string;
  custom_words?: Array<{ audio_storage_path?: string | null }> | null;
};

export type CustomListCleanupResult = {
  expiredListCount: number;
  audioFileCount: number;
};

import { createClient } from '@supabase/supabase-js';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  return handleAdminCustomListsCleanupRequest(request, response);
}

export async function handleAdminCustomListsCleanupRequest(request: ApiRequest, response: ApiResponse, dependencies: HandlerDependencies = {}) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const env = dependencies.env ?? process.env;
  const token = readBearerToken(request);
  if (!token) return response.status(401).json({ ok: false, error: 'Admin session required.' });

  try {
    const authClient = dependencies.createAuthClient?.(env) ?? createSupabaseAuthClient(env);
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) {
      console.error('Admin custom list cleanup auth failed', {
        authError: summarizeSupabaseError(error)
      });
      return response.status(401).json({ ok: false, error: 'Admin session required.' });
    }

    const cleanupClient = dependencies.createCleanupClient?.(env) ?? createSupabaseServiceClient(env);
    const result = await cleanupExpiredCustomLists(cleanupClient, dependencies.now?.() ?? new Date());
    return response.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('Admin custom list cleanup failed', {
      cleanupError: summarizeSupabaseError(error)
    });
    return response.status(500).json({ ok: false, error: 'Custom list cleanup failed.' });
  }
}

export async function cleanupExpiredCustomLists(client: SupabaseCleanupClient, now: Date): Promise<CustomListCleanupResult> {
  const cutoff = now.toISOString();
  const expiredResult = await client
    .from('custom_word_lists')
    .select('id,custom_words(audio_storage_path)')
    .lte('expires_at', cutoff);
  if (expiredResult.error) {
    throw new Error(`Could not read expired custom lists: ${formatSupabaseError(expiredResult.error)}`);
  }

  const expiredLists = expiredResult.data ?? [];
  const audioPaths = getUniqueAudioStoragePaths(expiredLists);
  const audioFileCount = await removeAudioPaths(client, audioPaths);

  const deletedResult = await client
    .from('custom_word_lists')
    .delete()
    .lte('expires_at', cutoff)
    .select('id');
  if (deletedResult.error) {
    throw new Error(`Could not delete expired custom lists: ${formatSupabaseError(deletedResult.error)}`);
  }

  return {
    expiredListCount: deletedResult.data?.length ?? 0,
    audioFileCount
  };
}

function getUniqueAudioStoragePaths(expiredLists: ExpiredCustomListRow[]) {
  return Array.from(new Set(expiredLists.flatMap(list => (
    list.custom_words ?? []
  ).map(word => word.audio_storage_path?.trim() ?? '').filter(Boolean))));
}

async function removeAudioPaths(client: SupabaseCleanupClient, paths: string[]) {
  let removedCount = 0;
  for (let index = 0; index < paths.length; index += 100) {
    const chunk = paths.slice(index, index + 100);
    const result = await client.storage.from('audio').remove(chunk);
    if (result.error) {
      throw new Error(`Could not delete custom-list audio: ${formatSupabaseError(result.error)}`);
    }
    removedCount += Array.isArray(result.data) ? result.data.length : chunk.length;
  }
  return removedCount;
}

function createSupabaseAuthClient(env: Record<string, string | undefined>): SupabaseAuthClient {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase auth credentials are not configured.');
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) as unknown as SupabaseAuthClient;
}

function createSupabaseServiceClient(env: Record<string, string | undefined>): SupabaseCleanupClient {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase service credentials are not configured.');
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) as unknown as SupabaseCleanupClient;
}

function readBearerToken(request: ApiRequest) {
  const authorization = readHeader(request, 'authorization');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? '';
}

function readHeader(request: ApiRequest, name: string) {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function formatSupabaseError(error: unknown) {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  const value = error as Record<string, unknown>;
  return [
    typeof value.message === 'string' ? value.message : '',
    typeof value.code === 'string' ? `code=${value.code}` : '',
    typeof value.details === 'string' ? value.details : '',
    typeof value.hint === 'string' ? value.hint : ''
  ].filter(Boolean).join(' ');
}

function summarizeSupabaseError(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return { message: error.message };
  if (typeof error === 'string') return { message: error };
  const value = error as Record<string, unknown>;
  return {
    message: typeof value.message === 'string' ? value.message : '',
    code: typeof value.code === 'string' ? value.code : '',
    details: typeof value.details === 'string' ? value.details.slice(0, 500) : '',
    hint: typeof value.hint === 'string' ? value.hint.slice(0, 500) : ''
  };
}
