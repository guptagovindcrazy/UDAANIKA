import { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';

// Runs `fetcher` (returns an axios promise) whenever `deps` change and unwraps { data } from the API envelope.
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((res) => !cancelled && setState({ data: res.data.data, loading: false, error: null }))
      .catch((err) => !cancelled && setState({ data: null, loading: false, error: getErrorMessage(err) }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
