import { useCallback, useEffect, useState } from 'react';

function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

function getPathname(path: string) {
  return new URL(path, window.location.origin).pathname;
}

export function useAdminPath() {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const onPopState = () => setPath(getCurrentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    if (getCurrentPath() !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setPath(`${getPathname(nextPath)}${new URL(nextPath, window.location.origin).search}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { path, navigate };
}
