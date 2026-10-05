import CopilotPanel from '../components/CopilotPanel'
import { useState, useEffect } from 'react'
import { incidentApi } from '../services/api'

export default function CopilotPage() {
  const [latestIncidentId, setLatestIncidentId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await incidentApi.getAll()
        if (res.data?.length > 0) setLatestIncidentId(res.data[0].id)
      } catch {}
    }
    load()
  }, [])

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-[10px] tracking-widest text-[#64748B] font-mono mb-0.5">MISSION OPERATIONS / COPILOT</div>
        <h1 className="text-lg font-semibold text-[#E5E7EB]">ASTRA Mission Copilot</h1>
      </div>
      <div className="max-w-3xl">
        <CopilotPanel incidentId={latestIncidentId} />
      </div>
    </div>
  )
}
