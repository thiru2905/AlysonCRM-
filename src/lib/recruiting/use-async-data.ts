import * as React from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Small data-fetching hook: runs `fetcher` whenever `deps` change, tracks
 * loading/error, and exposes `reload()` for retry controls.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  onSuccess?: (data: T) => void
) {
  const [state, setState] = React.useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = React.useState(0);

  const fetcherRef = React.useRef(fetcher);
  const onSuccessRef = React.useRef(onSuccess);

  React.useEffect(() => {
    fetcherRef.current = fetcher;
    onSuccessRef.current = onSuccess;
  });

  React.useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (cancelled) return;
        setState({ data, loading: false, error: null });
        onSuccessRef.current?.(data);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, reload };
}
