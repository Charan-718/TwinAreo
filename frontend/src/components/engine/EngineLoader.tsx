import React from 'react';
import { api } from '../../lib/api';
import { EngineDetail } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { ErrorState, PageSkeleton } from '../ui/Feedback';

interface Props {
  engineId: number;
  version?: number;
  children: (engine: EngineDetail, reload: () => void) => React.ReactNode;
}

/** Fetches one engine's twin state and renders loading, error and ready states. */
export const EngineLoader: React.FC<Props> = ({ engineId, version = 0, children }) => {
  const { data, error, loading, reload } = useAsync(() => api.engine(engineId), [engineId, version]);
  if (error && !data) return <ErrorState title={`Could not load engine FD004-${String(engineId).padStart(3, '0')}`} error={error} onRetry={reload} />;
  // Keep showing the current state while revalidating, so page-level feedback is not lost.
  if (!data) return <PageSkeleton label="Loading engine state" />;
  return <div aria-busy={loading}>{children(data, reload)}</div>;
};
