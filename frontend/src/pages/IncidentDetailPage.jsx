import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle2, ShieldAlert, Sparkles, BookOpen } from 'lucide-react'
import { incidentApi } from '../services/api'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import CopilotPanel from '../components/CopilotPanel'
import SatelliteVisualizer from '../components/SatelliteVisualizer'
import ReportExportModal from '../components/ReportExportModal'
import ProcedureModal from '../components/ProcedureModal'

export default function IncidentDetailPage() {
  const { id } = useParams()
  const [incident, setIncident] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [evidence, setEvidence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState(null)
  const [incidentStatus, setIncidentStatus] = useState('OPEN')

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
        if (inc?.status) setIncidentStatus(inc.status)
      } catch (e) {
        console.error('Failed to load incident detail:', e)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="p-8 font-mono text-xs text-text-dim flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-hud-cyan animate-ping" />
        Loading incident telemetry snapshot and evidence...
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="p-8 font-mono text-xs text-status-error">
        Incident not found in memory store.
      </div>
    )
  }

  const telEvidence = evidence?.telemetry_evidence || []
  const docEvidence = evidence?.document_evidence || []
  const scores = incident.subsystem_scores || {}

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/incidents" className="text-[10px] font-mono text-text-dim hover:text-hud-cyan flex items-center gap-1 transition-colors">
            <ArrowLeft size={11} /> BACK TO INCIDENTS QUEUE
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl font-orbitron font-bold text-hud-cyan glow-cyan-text">
                {incident.incident_number}
              </span>
              <StatusBadge status={incident.severity} pulse={incident.severity === 'CRITICAL'} />
              <StatusBadge status={incidentStatus} />
            </div>
            <h1 className="text-base font-semibold text-text-primary font-display">{incident.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-text-dim">
              <span>DETECTED: {new Date(incident.detected_at).toUTCString()}</span>
              <span>•</span>
              <span>SPACECRAFT: {incident.spacecraft_id || 'SAT-01'}</span>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-3 py-1.5 text-xs font-mono font-bold border border-hud-cyan text-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 rounded-xs shadow-hud-cyan flex items-center gap-1.5 transition-colors"
            >
              <FileText size={13} /> EXPORT MISSION REPORT
            </button>

            {incidentStatus !== 'RESOLVED' ? (
              <button
                onClick={() => setIncidentStatus('RESOLVED')}
                className="px-3 py-1.5 text-xs font-mono font-bold border border-hud-emerald text-hud-emerald bg-hud-emerald/10 hover:bg-hud-emerald/20 rounded-xs transition-colors flex items-center gap-1"
              >
                <CheckCircle2 size={13} /> MARK RESOLVED
              </button>
            ) : (
              <button
                onClick={() => setIncidentStatus('OPEN')}
                className="px-3 py-1.5 text-xs font-mono text-text-dim border border-border bg-bg-panel hover:text-text-primary rounded-xs transition-colors"
              >
                RE-OPEN INCIDENT
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Diagnostics, Visualizer, Evidence */}
        <div className="lg:col-span-7 space-y-4">
          {/* 2D Satellite Subsystem Heatmap */}
          <SatelliteVisualizer
            subsystemScores={scores}
            telemetry={incident.telemetry_snapshot}
          />

          {/* Root Cause Analysis Details */}
          <Panel title="ROOT CAUSE IDENTIFICATION & CALIBRATION">
            <div className="p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-text-dim uppercase">PROBABLE ROOT CAUSE</div>
                  <div className="text-sm font-display font-bold text-text-primary mt-0.5">
                    {incident.root_cause}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-orbitron font-extrabold text-hud-cyan glow-cyan-text">
                    {incident.root_cause_confidence ? `${Math.round(incident.root_cause_confidence * 100)}%` : '—'}
                  </div>
                  <div className="text-[8px] text-text-dim">CONFIDENCE</div>
                </div>
              </div>

              {/* Subsystem Deviation Score Bars */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="text-[9px] font-orbitron font-bold text-text-dim uppercase">
                  SUB-SYSTEM MULTI-VARIATE DEVIATION MATRIX
                </div>
                {Object.entries(scores).map(([sub, score]) => (
                  <div key={sub} className="flex items-center gap-3">
                    <span className="text-[10px] uppercase text-text-dim w-24">{sub}</span>
                    <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(score * 100)}%`,
                          background: score >= 0.7 ? '#EF4444' : score >= 0.4 ? '#F59E0B' : '#00F0FF',
                          boxShadow: score >= 0.7 ? '0 0 6px #EF4444' : 'none'
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-text-primary font-bold w-12 text-right">
                      {score.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Telemetry Evidence Snapshot */}
          {telEvidence.length > 0 && (
            <Panel title="TELEMETRY EVIDENCE SIGNALS">
              <div className="p-4 space-y-2 font-mono text-xs">
                {telEvidence.map((ev, i) => (
                  <div key={i} className="border-l-2 border-hud-amber/60 bg-hud-amber/5 p-2.5 rounded-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-hud-amber uppercase">{ev.title}</span>
                      {ev.deviation_pct && (
                        <span className="text-[9px] text-hud-cyan font-bold">
                          +{ev.deviation_pct.toFixed(1)}% DEV
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-primary font-sans">{ev.content}</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Retrieved Knowledge Base Procedures */}
          {docEvidence.length > 0 && (
            <Panel title="RETRIEVED SOP PROCEDURES">
              <div className="p-4 space-y-2 font-mono text-xs">
                {docEvidence.map((doc, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedDocId(doc.doc_id)}
                    className="border border-border/70 bg-bg-panel/40 p-3 rounded-xs hover:border-hud-cyan/60 cursor-pointer transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-hud-cyan font-bold text-[11px]">
                        <BookOpen size={12} />
                        <span>{doc.title}</span>
                      </div>
                      <span className="text-[9px] text-text-dim border border-border px-1.5 py-0.5 rounded-xs">
                        {doc.doc_id}
                      </span>
                    </div>
                    <div className="text-[11px] font-sans text-text-secondary line-clamp-2">
                      {doc.content}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* Right Column: Timeline & Incident Copilot */}
        <div className="lg:col-span-5 space-y-4">
          <Panel title="INCIDENT EVENT TIMELINE">
            <div className="p-4 space-y-3 font-mono text-xs">
              {timeline.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      ev.event_type === 'detection' ? 'bg-status-error shadow-[0_0_6px_#EF4444]'
                      : ev.event_type === 'analysis' ? 'bg-hud-cyan shadow-[0_0_6px_#00F0FF]'
                      : 'bg-hud-emerald'
                    }`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border/80 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="text-[9px] text-text-dim mb-0.5">
                      {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })} UTC • {ev.actor}
                    </div>
                    <div className="text-xs font-bold text-text-primary">{ev.title}</div>
                    {ev.description && <div className="text-[11px] text-text-secondary mt-0.5 font-sans">{ev.description}</div>}
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <div className="text-xs text-text-dim text-center py-4">No events recorded</div>
              )}
            </div>
          </Panel>

          <div className="h-[420px]">
            <CopilotPanel incidentId={id} compact />
          </div>
        </div>
      </div>

      {/* Export Report Modal */}
      {showReportModal && (
        <ReportExportModal
          incident={{ ...incident, status: incidentStatus }}
          timeline={timeline}
          evidence={evidence}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Procedure SOP Modal */}
      {selectedDocId && (
        <ProcedureModal
          docId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
        />
      )}
    </div>
  )
}

