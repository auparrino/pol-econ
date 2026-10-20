import { useEffect, useState, useCallback } from 'react';

// Keeps a small piece of app state in the URL hash (#p=salta&m=pobreza&v=ranking)
// so any view can be shared as a link. Uses the hash because the app is served
// from GitHub Pages without server-side routing.
function readHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return Object.fromEntries(params.entries());
}

export function useUrlState() {
  const [state, setState] = useState(readHash);

  useEffect(() => {
    const onHash = () => setState(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const update = useCallback((patch) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      for (const k of Object.keys(next)) if (next[k] == null || next[k] === '') delete next[k];
      const hash = new URLSearchParams(next).toString();
      const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`;
      window.history.replaceState(null, '', url);
      return next;
    });
  }, []);

  return [state, update];
}
