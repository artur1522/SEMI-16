import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tailwind.css'
import App from './App'
import { ThemeProvider } from './hooks/useTheme'
import { PreferencesProvider } from './hooks/usePreferences'
import { NotificationProvider } from './hooks/NotificationContext'
import { CloudProvider } from './store/cloudStore'
import ToastContainer from './components/ToastContainer'

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PreferencesProvider>
          <NotificationProvider>
            <CloudProvider>
              <App />
              <ToastContainer />
            </CloudProvider>
          </NotificationProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
