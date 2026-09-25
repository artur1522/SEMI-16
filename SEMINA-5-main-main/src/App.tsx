import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Planning from './pages/Planning'
import Costs from './pages/Costs'
import Infrastructure from './pages/Infrastructure'
import Security from './pages/Security'
import Network from './pages/Network'
import Services from './pages/Services'
import Config from './pages/Config'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/infrastructure" element={<Infrastructure />} />
        <Route path="/security" element={<Security />} />
        <Route path="/network" element={<Network />} />
        <Route path="/services" element={<Services />} />
        <Route path="/config" element={<Config />} />
      </Route>
    </Routes>
  )
}