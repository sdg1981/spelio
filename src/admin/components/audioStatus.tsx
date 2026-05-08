import type { AudioStatus } from '../types';
import { StatusPill } from './StatusPill';

export function AudioStatusPill({ status }: { status: AudioStatus }) {
  if (status === 'ready') return <StatusPill tone="green">Generated</StatusPill>;
  if (status === 'failed') return <StatusPill tone="amber">Failed</StatusPill>;
  if (status === 'queued') return <StatusPill tone="blue">Queued</StatusPill>;
  if (status === 'generating') return <StatusPill tone="blue">Generating</StatusPill>;
  return <StatusPill tone="red">Missing</StatusPill>;
}
