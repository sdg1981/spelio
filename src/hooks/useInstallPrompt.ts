import { useCallback, useEffect, useState } from 'react';
import { shouldShowInstallAction, spelioInstallPrompt } from '../lib/pwa/installPrompt';

export function useInstallPrompt() {
  const [state, setState] = useState(() => spelioInstallPrompt.getState());

  useEffect(() => {
    spelioInstallPrompt.initialize();
    setState(spelioInstallPrompt.getState());
    return spelioInstallPrompt.subscribe(setState);
  }, []);

  const promptInstall = useCallback(() => spelioInstallPrompt.promptInstall(), []);

  return {
    ...state,
    canInstall: shouldShowInstallAction(state),
    promptInstall
  };
}
