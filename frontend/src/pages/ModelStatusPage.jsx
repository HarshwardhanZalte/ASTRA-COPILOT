import { useState, useEffect } from 'react'
import { systemApi } from '../services/api'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'

export default function ModelStatusPage() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const load = async () => {
      try { setStatus(await systemApi.getStatus()) } catch {}
    }
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-[10px] tracking-widest text-[#64748B] font-mono mb-0.5">SYSTEM / MODEL STATUS</div>
        <h1 className="text-lg font-semibold text-[#E5E7EB]">ML & System Status</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="ANOMALY DETECTION MODEL">
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Model Type</span>
              <span className="font-mono text-[#E5E7EB]">Isolation Forest</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Status</span>
              <StatusBadge status={status?.ml?.detector_trained ? 'OK' : 'ERROR'} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Estimators</span>
              <span className="font-mono text-[#E5E7EB]">100</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Contamination Rate</span>
              <span className="font-mono text-[#E5E7EB]">0.05</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Training Samples</span>
              <span className="font-mono text-[#E5E7EB]">1,000 synthetic normal</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Features</span>
              <span className="font-mono text-[#E5E7EB]">13 telemetry channels</span>
            </div>
          </div>
        </Panel>

        <Panel title="RAG KNOWLEDGE BASE">
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Copilot Mode</span>
              <span className={`font-mono ${
                status?.rag?.copilot_mode === 'GEMINI' ? 'text-[#22C55E]' : 'text-[#F59E0B]'
              }`}>{status?.rag?.copilot_mode || 'DEMO'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Documents Loaded</span>
              <span className="font-mono text-[#E5E7EB]">{status?.rag?.documents_loaded ?? '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Embedding Model</span>
              <span className="font-mono text-[#E5E7EB]">all-MiniLM-L6-v2</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Vector Dimensions</span>
              <span className="font-mono text-[#E5E7EB]">384</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Retrieval Method</span>
              <span className="font-mono text-[#E5E7EB]">Cosine Similarity</span>
            </div>
          </div>
        </Panel>

        <Panel title="SIMULATION">
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Running</span>
              <StatusBadge status={status?.simulation?.running ? 'OK' : 'INFO'} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Scenario</span>
              <span className="font-mono text-[#E5E7EB]">{status?.simulation?.scenario || '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Telemetry Records</span>
              <span className="font-mono text-[#E5E7EB]">{status?.simulation?.telemetry_count ?? 0}</span>
            </div>
          </div>
        </Panel>

        <Panel title="DATABASE">
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Provider</span>
              <span className="font-mono text-[#E5E7EB]">Neon PostgreSQL</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Status</span>
              <StatusBadge status={status?.database?.connected ? 'OK' : 'WARN'} />
            </div>
            <div className="text-[10px] text-[#64748B]">
              {status?.database?.connected
                ? 'Connected to Neon PostgreSQL'
                : 'Running in memory-only mode. Configure DATABASE_URL for persistence.'}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
