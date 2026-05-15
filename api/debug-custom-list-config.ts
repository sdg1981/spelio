declare const process: {
  env: Record<string, string | undefined>;
};

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

import { getCustomListModerationDiagnostics } from './custom-list-config.js';

export default function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  response.setHeader('Cache-Control', 'no-store, max-age=0');
  return response.status(200).json(getCustomListModerationDiagnostics(process.env));
}
