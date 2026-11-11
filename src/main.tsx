import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import AppearanceProvider from './components/AppearanceProvider';
import { initAppearance } from './lib/appearance';
import { LocaleProvider } from './i18n';

initAppearance();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AppearanceProvider>
        <App />
      </AppearanceProvider>
    </LocaleProvider>
  </StrictMode>,
);
