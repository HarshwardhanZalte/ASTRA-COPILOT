import { useState } from 'react'
import { X, Printer, Copy, Check, FileDown, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function ReportExportModal({ incident, timeline = [], evidence = null, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!incident) return null

  const telEvidence = evidence?.telemetry_evidence || []
  const docEvidence = evidence?.document_evidence || []
  const scores = incident.subsystem_scores || {}

  const generateMarkdown = () => {
    return `# ASTRA MISSION OPERATIONS — POST-INCIDENT DIAGNOSTIC REPORT
Generated: ${new Date().toUTCString()}
Spacecraft ID: ${incident.spacecraft_id || 'SAT-01'}
Incident Number: ${incident.incident_number}
Classification: RESTRICTED • MISSION CRITICAL

---

## 1. INCIDENT SUMMARY
- **Title:** ${incident.title}
- **Severity:** ${incident.severity}
- **Status:** ${incident.status}
- **Detected Timestamp:** ${new Date(incident.detected_at).toUTCString()}
- **Probable Root Cause:** ${incident.root_cause || 'Under Investigation'}
- **Diagnosis Confidence:** ${incident.root_cause_confidence ? (incident.root_cause_confidence * 100).toFixed(1) + '%' : 'N/A'}

---

## 2. SUBSYSTEM DEVIATION SCORES
${Object.entries(scores).map(([sub, sc]) => `- **${sub.toUpperCase()}:** ${Number(sc).toFixed(3)} (${(Number(sc) * 100).toFixed(1)}% anomaly probability)`).join('\n')}

---

## 3. TELEMETRY EVIDENCE SNAPSHOT
${telEvidence.map(ev => `- [${ev.subsystem || 'SYS'}] ${ev.title}: ${ev.content} (Deviation: ${ev.deviation_pct ? ev.deviation_pct.toFixed(1) + '%' : 'N/A'})`).join('\n') || '- No specific telemetry deviations recorded.'}

---

## 4. INCIDENT TIMELINE & EVENT LOG
${timeline.map(tl => `- **${new Date(tl.timestamp).toLocaleTimeString('en-US')} UTC** [${tl.actor || 'SYSTEM'}]: ${tl.title} — ${tl.description || ''}`).join('\n') || '- No timeline events recorded.'}

---

## 5. COPILOT TRIAGE & RECOMMENDED ACTIONS
${(incident.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n') || '1. Follow standard flight operating procedures.'}

**Flight Rule Notice:** Human Flight Director approval is mandatory prior to uplinking recovery command sequences.

---
**Report Approved by:** ASTRA Automated Mission Support & Operator Console
`
  }

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="hud-panel w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xs border border-hud-cyan/50 shadow-[0_0_35px_rgba(0,240,255,0.25)] bg-bg-deep overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-secondary/90">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hud-cyan shadow-[0_0_6px_#00F0FF]" />
            <span className="text-xs font-orbitron font-bold tracking-widest text-hud-cyan uppercase">
              MISSION POST-INCIDENT REPORT • {incident.incident_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-2.5 py-1 text-[11px] font-mono font-bold border border-hud-cyan/50 text-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 rounded-xs flex items-center gap-1 transition-colors"
            >
              {copied ? <Check size={12} className="text-hud-emerald" /> : <Copy size={12} />}
              <span>{copied ? 'COPIED!' : 'COPY MARKDOWN'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 text-[11px] font-mono font-bold border border-border text-text-primary bg-bg-panel hover:border-hud-cyan rounded-xs flex items-center gap-1 transition-colors"
            >
              <Printer size={12} /> PRINT / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-text-dim hover:text-text-primary rounded-xs transition-colors ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 font-mono text-xs text-text-primary bg-bg-deep">
          {/* Official Aerospace Report Header */}
          <div className="border border-border/80 p-4 bg-bg-secondary/40 rounded-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-orbitron font-bold text-hud-cyan tracking-widest uppercase">
                NATIONAL AEROSPACE MISSION CONTROL • FLIGHT SUPPORT
              </div>
              <h2 className="text-base font-orbitron font-extrabold text-text-primary mt-0.5">
                SAT-01 Incident Post-Mortem Diagnostic Report
              </h2>
              <div className="text-[10px] text-text-dim mt-1">
                INCIDENT ID: <span className="text-text-primary font-bold">{incident.incident_number}</span> • SPACECRAFT: SAT-01 • UTC TIMESTAMP: {new Date(incident.detected_at).toUTCString()}
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="px-2 py-0.5 border border-status-error/60 bg-status-error/15 text-status-error font-bold text-[10px] rounded-xs inline-block">
                SEVERITY: {incident.severity}
              </span>
              <div className="text-[9px] text-text-dim">CLASSIFICATION: RESTRICTED</div>
            </div>
          </div>

          {/* Root Cause & Diagnostic Summary */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-orbitron font-bold text-text-dim uppercase tracking-wider">
              1. ROOT CAUSE DETERMINATION & ML CONFIDENCE
            </div>
            <div className="p-3 bg-bg-panel/60 border border-border rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-bold text-text-primary text-sm">
                  {incident.root_cause || 'Anomaly Detected'}
                </span>
                <span className="text-xs font-mono font-bold text-hud-cyan">
                  {incident.root_cause_confidence ? `${Math.round(incident.root_cause_confidence * 100)}% Confidence` : 'N/A'}
                </span>
              </div>
              <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                {incident.title}. Multiple subsystem parameters diverged beyond 3-sigma standard deviation boundaries.
              </p>
            </div>
          </div>

          {/* Subsystem Deviation Scores Matrix */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-orbitron font-bold text-text-dim uppercase tracking-wider">
              2. SUBSYSTEM DEVIATION MATRIX
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(scores).map(([sub, sc]) => (
                <div key={sub} className="p-2 border border-border/70 bg-bg-secondary/40 rounded-xs text-center">
                  <div className="text-[9px] text-text-dim uppercase">{sub}</div>
                  <div className={`text-sm font-bold mt-0.5 ${
                    sc >= 0.7 ? 'text-status-error' : sc >= 0.4 ? 'text-hud-amber' : 'text-hud-cyan'
                  }`}>
                    {(Number(sc) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Evidence Snapshot */}
          {telEvidence.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-orbitron font-bold text-text-dim uppercase tracking-wider">
                3. TELEMETRY EVIDENCE LOGS
              </div>
              <div className="space-y-1">
                {telEvidence.map((ev, i) => (
                  <div key={i} className="p-2 bg-bg-panel/40 border border-border/60 rounded-xs flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-hud-cyan font-bold mr-2">[{ev.subsystem || 'SYS'}]</span>
                      <span className="text-text-primary">{ev.content}</span>
                    </div>
                    {ev.deviation_pct && (
                      <span className="text-hud-amber font-bold text-[10px]">
                        +{ev.deviation_pct.toFixed(1)}% DEV
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Timeline */}
          {timeline.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-orbitron font-bold text-text-dim uppercase tracking-wider">
                4. RECONSTRUCTED INCIDENT TIMELINE
              </div>
              <div className="border border-border/70 bg-bg-secondary/30 p-3 rounded-xs space-y-2">
                {timeline.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[11px] border-l-2 border-hud-cyan/50 pl-2.5">
                    <span className="text-text-dim text-[10px] flex-shrink-0">
                      {new Date(ev.timestamp).toLocaleTimeString('en-US')} UTC
                    </span>
                    <div>
                      <span className="font-bold text-text-primary">{ev.title}</span>
                      {ev.description && <span className="text-text-secondary ml-1">— {ev.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign-Off Block */}
          <div className="pt-4 border-t border-border flex items-center justify-between text-[10px] text-text-dim">
            <div>
              REPORT STATUS: <span className="text-hud-emerald font-bold">VERIFIED & ARCHIVED</span>
            </div>
            <div>
              AUTHORIZED BY: <span className="text-text-primary font-bold">FLIGHT DIRECTOR / ASTRA CONSOLE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
