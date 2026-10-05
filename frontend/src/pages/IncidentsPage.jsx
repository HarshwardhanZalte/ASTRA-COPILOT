import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { incidentApi } from '../services/api'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await incidentApi.getAll()
        setIncidents(res.data || [])
      } catch {}
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-[10px] tracking-widest text-[#64748B] font-mono mb-0.5">MISSION OPERATIONS / INCIDENTS</div>
        <h1 className="text-lg font-semibold text-[#E5E7EB]">Incident Registry</h1>
      </div>

      <Panel>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#263142]">
              <th className="px-4 py-2 text-left text-[10px] font-mono text-[#64748B] font-normal">INCIDENT</th>
              <th className="px-4 py-2 text-left text-[10px] font-mono text-[#64748B] font-normal">TITLE</th>
              <th className="px-4 py-2 text-center text-[10px] font-mono text-[#64748B] font-normal">SEVERITY</th>
              <th className="px-4 py-2 text-center text-[10px] font-mono text-[#64748B] font-normal">STATUS</th>
              <th className="px-4 py-2 text-left text-[10px] font-mono text-[#64748B] font-normal">ROOT CAUSE</th>
              <th className="px-4 py-2 text-left text-[10px] font-mono text-[#64748B] font-normal">DETECTED</th>
              <th className="px-4 py-2 text-center text-[10px] font-mono text-[#64748B] font-normal">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#64748B]">Loading...</td></tr>
            )}
            {!loading && incidents.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#64748B]">No incidents. Start the simulator and inject a fault.</td></tr>
            )}
            {incidents.map(inc => (
              <tr key={inc.id} className="border-b border-[#1a2332] hover:bg-white/2">
                <td className="px-4 py-3 font-mono text-xs text-[#38BDF8]">{inc.incident_number}</td>
                <td className="px-4 py-3 text-xs text-[#E5E7EB]">{inc.title}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={inc.severity} /></td>
                <td className="px-4 py-3 text-center"><StatusBadge status={inc.status} /></td>
                <td className="px-4 py-3 text-xs text-[#94A3B8]">{inc.root_cause || '—'}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-[#64748B]">
                  {new Date(inc.detected_at).toLocaleTimeString('en-US', { hour12: false })}
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="text-[10px] text-[#38BDF8] hover:underline flex items-center gap-1 justify-center"
                  >
                    Inspect <ChevronRight size={10} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
