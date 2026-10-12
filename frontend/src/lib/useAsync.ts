import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  reload: () => void;
}

/** Runs an async loader whenever deps change; ignores results from superseded calls. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const callId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  useEffect(() => {
    const id = ++callId.current;
    setLoading(true);
    setError(null);
    run()
      .then((d) => { if (id === callId.current) setData(d); })
      .catch((e) => { if (id === callId.current) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (id === callId.current) setLoading(false); });
  }, [run, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload };
}
