import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapNative } from './native/bootstrap'
import { configureNativeStore, platformNativeStorage, reconcileBeforeStart } from './services/nativeStore'
import { NATIVE_BACKUP_KEYS } from './services/persistence'

void bootstrapNative()

// The native copy has to be reconciled before the app reads its saved data, so
// a player whose WebView storage was cleared gets their progress back.
configureNativeStore(NATIVE_BACKUP_KEYS, platformNativeStorage())

void reconcileBeforeStart().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
