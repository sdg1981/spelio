export type CustomListModerationSelectedProvider = 'openai' | 'azure' | 'mock-safe' | 'none' | 'unsupported';

export type CustomListModerationDiagnostics = {
  provider: string;
  hasOpenAIKey: boolean;
  openAIKeyPrefix: string;
  model: string;
  vercelEnv: string;
  nodeEnv: string;
  selectedProvider: CustomListModerationSelectedProvider;
  missing: string[];
};

export function getCustomListModerationDiagnostics(env: Record<string, string | undefined>): CustomListModerationDiagnostics {
  const rawProvider = (env.CUSTOM_LIST_MODERATION_PROVIDER ?? '').trim();
  const provider = rawProvider.toLowerCase();
  const hasOpenAIKey = Boolean(env.OPENAI_API_KEY);
  const hasAzureEndpoint = Boolean(env.AZURE_CONTENT_SAFETY_ENDPOINT);
  const hasAzureKey = Boolean(env.AZURE_CONTENT_SAFETY_KEY);
  const mockSafeAllowed = env.CUSTOM_LIST_MODERATION_MOCK_SAFE === 'true' && env.NODE_ENV !== 'production' && env.VERCEL_ENV !== 'production';
  const model = env.OPENAI_MODERATION_MODEL || 'omni-moderation-latest';

  let selectedProvider: CustomListModerationSelectedProvider = 'none';
  let missing: string[] = [];

  if (provider === 'openai') {
    selectedProvider = 'openai';
    missing = hasOpenAIKey ? [] : ['OPENAI_API_KEY'];
  } else if (provider === 'azure') {
    selectedProvider = 'azure';
    missing = [
      hasAzureEndpoint ? '' : 'AZURE_CONTENT_SAFETY_ENDPOINT',
      hasAzureKey ? '' : 'AZURE_CONTENT_SAFETY_KEY'
    ].filter(Boolean);
  } else if (provider) {
    selectedProvider = 'unsupported';
    missing = ['CUSTOM_LIST_MODERATION_PROVIDER'];
  } else if (hasAzureEndpoint || hasAzureKey) {
    selectedProvider = 'azure';
    missing = [
      hasAzureEndpoint ? '' : 'AZURE_CONTENT_SAFETY_ENDPOINT',
      hasAzureKey ? '' : 'AZURE_CONTENT_SAFETY_KEY'
    ].filter(Boolean);
  } else if (hasOpenAIKey) {
    selectedProvider = 'openai';
    missing = [];
  } else if (mockSafeAllowed) {
    selectedProvider = 'mock-safe';
    missing = [];
  } else {
    selectedProvider = 'none';
    missing = ['OPENAI_API_KEY', 'AZURE_CONTENT_SAFETY_ENDPOINT', 'AZURE_CONTENT_SAFETY_KEY'];
  }

  return {
    provider: rawProvider,
    hasOpenAIKey,
    openAIKeyPrefix: getSecretPrefix(env.OPENAI_API_KEY),
    model,
    vercelEnv: env.VERCEL_ENV ?? '',
    nodeEnv: env.NODE_ENV ?? '',
    selectedProvider,
    missing
  };
}

export function getDeploymentDiagnosticFields(env: Record<string, string | undefined>) {
  return {
    buildTimestamp: env.BUILD_TIMESTAMP ?? env.VITE_BUILD_TIMESTAMP ?? '',
    vercelGitCommitShaPrefix: getSecretPrefix(env.VERCEL_GIT_COMMIT_SHA),
    vercelDeploymentId: env.VERCEL_DEPLOYMENT_ID ?? ''
  };
}

function getSecretPrefix(value: string | undefined) {
  if (!value) return '';
  return value.slice(0, 7);
}
