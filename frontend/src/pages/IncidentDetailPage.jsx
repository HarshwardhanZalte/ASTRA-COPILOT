import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { incidentApi } from '../services/api'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import CopilotPanel from '../components/CopilotPanel'

export default function IncidentDetailPage() {
  const { id } = useParams()
  const [incident, setIncident] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [evidence, setEvidence] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [inc, tl, ev] = await Promise.all([
          incidentApi.getById(id),
          incidentApi.getTimeline(id),
          incidentApi.getEvidence(id)
        ])
        setIncident(inc)
        setTimeline(tl.events || [])
        setEvidence(ev)
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-8 text-xs text-[#64748B]">Loading incident...</div>
  if (!incident) return <div className="p-8 text-xs text-[#EF4444]">Incident not found.</div>

  const telEvidence = evidence?.telemetry_evidence || []
  const docEvidence = evidence?.document_evidence || []
  const scores = incident.subsystem_scores || {}

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/incidents" className="text-[10px] text-[#64748B] hover:text-[#38BDF8] flex items-center gap-1">
            <ArrowLeft size={10} /> Back to Incidents
          </Link>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-base font-mono font-bold text-[#38BDF8]">{incident.incident_number}</span>
              <StatusBadge status={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <h1 className="text-base font-semibold text-[#E5E7EB]">{incident.title}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[10px] font-mono text-[#64748B]">
                Detected: {new Date(incident.detected_at).toLocaleTimeString('en-US', { hour12: false })} UTC
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">{incident.spacecraft_id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Panel title="ROOT CAUSE ANALYSIS">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#E5E7EB]">{incident.root_cause}</span>
                <span className="text-xs font-mono text-[#38BDF8]">
                  {incident.root_cause_confidence ? `${Math.round(incident.root_cause_confidence * 100)}% confidence` : ''}
                </span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(scores).map(([sub, score]) => (
                  <div key={sub} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase text-[#64748B] w-20">{sub}</span>
                    <div className="flex-1 h-1.5 bg-[#263142]">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.round(score * 100)}%`,
                          background: score >= 0.7 ? '#EF4444' : score >= 0.4 ? '#F59E0B' : '#22C55E'
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#94A3B8] w-10 text-right">
                      {score.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {telEvidence.length > 0 && (
            <Panel title="TELEMETRY EVIDENCE">
              <div className="p-4 space-y-2">
                {telEvidence.map((ev, i) => (
                  <div key={i} className="border-l-2 border-[#F59E0B]/40 pl-3 py-1">
                    <div className="text-[10px] font-mono text-[#F59E0B] mb-0.5">{ev.title}</div>
                    <div className="text-xs text-[#94A3B8]">{ev.content}</div>
                    {ev.deviation_pct && (
                      <div className="text-[10px] font-mono text-[#64748B] mt-0.5">
                        Deviation: {ev.deviation_pct.toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {docEvidence.length > 0 && (
            <Panel title="RETRIEVED DOCUMENTS">
              <div className="p-4 space-y-3">
                {docEvidence.map((doc, i) => (
                  <div key={i} className="border border-[#1E2D40] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-[#38BDF8]">{doc.title}</span>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        {doc.similarity_score ? `${(doc.similarity_score * 100).toFixed(0)}% match` : ''}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#64748B] mb-1">{doc.doc_id} · {doc.doc_type}</div>
                    <div className="text-xs text-[#94A3B8]">{doc.content?.slice(0, 300)}...</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel title="RECOMMENDATIONS">
            <div className="p-4">
              <div className="mb-3 px-3 py-2 border border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[11px] text-[#F59E0B] font-mono">
                ⚠ RECOMMENDATION — HUMAN APPROVAL REQUIRED
              </div>
              <div className="space-y-2 text-xs text-[#94A3B8]">
                {(incident.recommendations || [
                  "Verify the affected telemetry against an independent sensor.",
                  "Review the relevant subsystem procedure.",
                  "Monitor the trend and assess mission impact.",
                ]).map((recommendation, index) => (
                  <div key={recommendation}>{index + 1}. {recommendation}</div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="col-span-1 space-y-4">
          <Panel title="INCIDENT TIMELINE">
            <div className="p-3 space-y-3">
              {timeline.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${
                      ev.event_type === 'detection' ? 'bg-[#EF4444]'
                      : ev.event_type === 'analysis' ? 'bg-[#38BDF8]'
                      : 'bg-[#22C55E]'
                    }`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-[#263142] mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="text-[9px] font-mono text-[#64748B] mb-0.5">
                      {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })} · {ev.actor}
                    </div>
                    <div className="text-[11px] text-[#E5E7EB]">{ev.title}</div>
                    {ev.description && <div className="text-[10px] text-[#64748B] mt-0.5">{ev.description}</div>}
                  </div>
                </div>
              ))}
              {timeline.length === 0 && <div className="text-xs text-[#64748B]">No events recorded</div>}
            </div>
          </Panel>

          <CopilotPanel incidentId={id} compact />
        </div>
      </div>
    </div>
  )
}
