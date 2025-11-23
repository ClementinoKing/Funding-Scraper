import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './style.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ProgramsProvider } from './contexts/ProgramsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ProgramsProvider>
          <App />
          <Toaster position="top-right" richColors />
        </ProgramsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
