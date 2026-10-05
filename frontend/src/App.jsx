import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import SimulatorPage from './pages/SimulatorPage'
import MissionPage from './pages/MissionPage'
import TelemetryPage from './pages/TelemetryPage'
import IncidentsPage from './pages/IncidentsPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import CopilotPage from './pages/CopilotPage'
import ScenariosPage from './pages/ScenariosPage'
import ModelStatusPage from './pages/ModelStatusPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/mission" replace />} />
          <Route path="/mission" element={<MissionPage />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/copilot" element={<CopilotPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/model-status" element={<ModelStatusPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
