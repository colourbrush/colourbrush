import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LocalRepository } from './data/repository';
import { StoreProvider } from './data/store';
import { LocalAuth } from './services/auth';
import './styles.css';

// Swap these two for cloud implementations when Showrunner gets accounts.
const repo = new LocalRepository();
const auth = new LocalAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider repo={repo} auth={auth}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
