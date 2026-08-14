import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { UniverseProvider } from './store/UniverseStore.tsx'
import { AuthProvider } from './store/AuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UniverseProvider>
          <App />
        </UniverseProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
