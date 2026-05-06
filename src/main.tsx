import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserUnsupportedFallback } from './components/BrowserUnsupportedFallback';
import { browserLooksOkay } from './lib/browserCompatibility';
import './styles.css';

const Root = browserLooksOkay() ? App : BrowserUnsupportedFallback;

createRoot(document.getElementById('root')!).render(<React.StrictMode><Root /></React.StrictMode>);
