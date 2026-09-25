import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tailwind.css'
import App from './App'
import { ThemeProvider } from './hooks/useTheme'
import { PreferencesProvider } from './hooks/usePreferences'
import { CloudProvider } from './store/cloudStore'

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PreferencesProvider>
          <CloudProvider>
            <App />
          </CloudProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
