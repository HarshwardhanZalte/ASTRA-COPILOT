import { useState } from 'react'
import { X, BookOpen, CheckSquare, Square, AlertTriangle, ShieldCheck, FileText } from 'lucide-react'

const PROCEDURES_DB = {
  'PWR-PROC-001': {
    docId: 'PWR-PROC-001',
    title: 'Power Management and Battery Recovery Procedure',
    subsystem: 'Power Subsystem',
    version: 'v3.2',
    classification: 'FLIGHT OPERATIONS MANUAL',
    overview: 'This procedure governs telemetry monitoring, impedance diagnostic sequences, battery cell reconditioning, and load shedding protocols for SAT-01.',
    nominalRanges: [
      { param: 'Battery Voltage', range: '27.4V — 28.6V', nominal: '28.0V' },
      { param: 'Battery Current', range: '4.5A — 5.5A', nominal: '5.0A' },
      { param: 'Battery Temperature', range: '20°C — 30°C', nominal: '25.0°C' },
      { param: 'Power Consumption', range: '7.9W — 9.1W', nominal: '8.5W' },
    ],
    steps: [
      { step: 1, title: 'Cross-Verify Voltage Transducers', text: 'Query secondary telemetry bus to verify if voltage drop is physical or sensor drift.', required: true },
      { step: 2, title: 'Evaluate Solar Array Bus Current', text: 'Confirm solar array output is generating > 1.2 kW and charging regulator is operational.', required: true },
      { step: 3, title: 'Inhibit Non-Essential Payload Loads', text: 'Temporarily shed secondary imaging payload load to reduce current draw below 5.2A.', required: true },
      { step: 4, title: 'Monitor Thermal Dissipation Curve', text: 'Track battery thermistor gradient over 5 minutes to verify temperature stabilization.', required: false },
    ],
    warnings: 'HUMAN FLIGHT DIRECTOR APPROVAL MANDATORY before executing command sequences.'
  },
  'THM-PROC-002': {
    docId: 'THM-PROC-002',
    title: 'Avionics Thermal Overheat Response Procedure',
    subsystem: 'Thermal Control',
    version: 'v2.1',
    classification: 'FLIGHT OPERATIONS MANUAL',
    overview: 'Guidance for mitigating excessive heat accumulation on the main flight computer and payload optical sensor bay.',
    nominalRanges: [
      { param: 'CPU Temperature', range: '40.0°C — 50.0°C', nominal: '45.0°C' },
      { param: 'Payload Temperature', range: '18.0°C — 22.0°C', nominal: '20.0°C' },
    ],
    steps: [
      { step: 1, title: 'Verify Redundant Thermistors', text: 'Confirm temperature telemetry across all three avionics bay sensors.', required: true },
      { step: 2, title: 'Activate Auxiliary Radiator Loop', text: 'Engage secondary fluid heat-pipe loop to boost thermal dissipation to deep space.', required: true },
      { step: 3, title: 'Throttle CPU Clock Frequency', text: 'Reduce processing duty cycle to 25% to minimize resistive thermal dissipation.', required: true },
    ],
    warnings: 'Exceeding 75°C on avionics node will trigger automatic safe mode transfer.'
  },
  'COM-PROC-003': {
    docId: 'COM-PROC-003',
    title: 'Transponder Link Recovery & RF Diagnostics',
    subsystem: 'RF & Communications',
    version: 'v1.9',
    classification: 'FLIGHT OPERATIONS MANUAL',
    overview: 'Recovery sequences for severe link degradation, high frame packet drop, and deep space ground occultation.',
    nominalRanges: [
      { param: 'Signal Strength', range: '-79 dBm — -71 dBm', nominal: '-75 dBm' },
      { param: 'Packet Loss', range: '0.0% — 1.0%', nominal: '< 0.5%' },
      { param: 'Latency', range: '220ms — 280ms', nominal: '250ms' },
    ],
    steps: [
      { step: 1, title: 'Check Ground Station Antenna Tracking', text: 'Verify elevation and azimuth angle alignment against ephemeris predictions.', required: true },
      { step: 2, title: 'Switch to Low-Rate Telemetry Beacon Mode', text: 'Throttle bit rate to 9.6 kbps to enhance signal-to-noise ratio in degraded RF.', required: true },
      { step: 3, title: 'Switch to Backup Traveling Wave Tube Amplifier (TWTA)', text: 'Cross-strap RF feed to Redundant S-band Transponder B.', required: true },
    ],
    warnings: 'Transponder switchover takes 45 seconds to re-lock carrier frequency.'
  },
  'SAF-PROC-001': {
    docId: 'SAF-PROC-001',
    title: 'Spacecraft Safe Mode Entry & Preservation',
    subsystem: 'Systems Engineering',
    version: 'v4.0',
    classification: 'CONTINGENCY EMERGENCY PROTOCOL',
    overview: 'Emergency protocol to stabilize spacecraft attitude, establish sun-pointing orientation, and preserve power.',
    nominalRanges: [],
    steps: [
      { step: 1, title: 'Inhibit All Payload Instruments', text: 'Isolate power bus switches for science and camera payloads.', required: true },
      { step: 2, title: 'Initiate Sun-Acquisition Attitude Mode', text: 'Use coarse sun sensors and magnetorquers to align solar arrays directly at the Sun.', required: true },
      { step: 3, title: 'Transmit Emergency Health Beacon', text: 'Broadcast continuous 1200 baud health carrier on omnidirectional antennas.', required: true },
    ],
    warnings: 'CRITICAL ACTION: Requires verbal authorization from Lead Flight Director.'
  }
}

export default function ProcedureModal({ docId, onClose }) {
  const [completedSteps, setCompletedSteps] = useState({})

  if (!docId) return null

  // Resolve matching doc or fallback
  const normalizedId = docId.toUpperCase().trim()
  const proc = PROCEDURES_DB[normalizedId] || PROCEDURES_DB['PWR-PROC-001']

  const toggleStep = (stepNum) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="hud-panel w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xs border border-hud-cyan/40 shadow-[0_0_30px_rgba(0,240,255,0.2)] bg-bg-deep overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-secondary/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xs border border-hud-cyan/40 bg-hud-cyan/10 text-hud-cyan shadow-hud-cyan">
              <BookOpen size={15} />
            </div>
            <div>
              <div className="text-[10px] font-orbitron font-bold tracking-widest text-hud-cyan">
                {proc.docId} • {proc.classification}
              </div>
              <h2 className="text-sm font-display font-bold text-text-primary">
                {proc.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-dim hover:text-text-primary hover:bg-bg-panel rounded-xs transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs text-text-secondary">
          {/* Overview */}
          <div className="space-y-1">
            <div className="text-[9px] font-orbitron font-bold text-text-dim uppercase tracking-wider">
              PROCEDURE OVERVIEW & SCOPE
            </div>
            <p className="text-xs text-text-primary leading-relaxed font-sans bg-bg-panel/40 p-3 rounded-xs border border-border/60">
              {proc.overview}
            </p>
          </div>

          {/* Nominal Parameters Reference Table */}
          {proc.nominalRanges.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-orbitron font-bold text-text-dim uppercase tracking-wider">
                NOMINAL OPERATING RANGES
              </div>
              <div className="grid grid-cols-2 gap-2">
                {proc.nominalRanges.map((nr, i) => (
                  <div key={i} className="p-2 rounded-xs border border-border/60 bg-bg-secondary/40 flex items-center justify-between text-[11px]">
                    <span className="text-text-dim">{nr.param}:</span>
                    <span className="text-hud-cyan font-bold">{nr.range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Operator Checklist */}
          <div className="space-y-2">
            <div className="text-[9px] font-orbitron font-bold text-text-dim uppercase tracking-wider flex items-center justify-between">
              <span>OPERATOR ACTION CHECKLIST</span>
              <span className="text-hud-cyan text-[10px]">
                {Object.values(completedSteps).filter(Boolean).length} / {proc.steps.length} VERIFIED
              </span>
            </div>

            <div className="space-y-2">
              {proc.steps.map((s) => {
                const isChecked = Boolean(completedSteps[s.step])
                return (
                  <div
                    key={s.step}
                    onClick={() => toggleStep(s.step)}
                    className={`p-3 rounded-xs border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'border-hud-emerald/60 bg-hud-emerald/10 text-text-primary'
                        : 'border-border/70 bg-bg-panel/50 hover:border-hud-cyan/40 text-text-secondary'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isChecked ? (
                        <CheckSquare size={16} className="text-hud-emerald" />
                      ) : (
                        <Square size={16} className="text-text-dim" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                        <span>STEP {s.step}: {s.title}</span>
                        {s.required && (
                          <span className="text-[8px] font-mono px-1 border border-hud-amber/50 text-hud-amber bg-hud-amber/10 rounded-xs">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-sans text-text-secondary leading-snug">
                        {s.text}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Safety Warning */}
          <div className="p-3 border border-hud-amber/40 bg-hud-amber/10 rounded-xs flex items-center gap-2.5 text-hud-amber text-[11px]">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>{proc.warnings}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border bg-bg-secondary/60 flex items-center justify-between text-xs font-mono">
          <div className="text-[10px] text-text-dim">
            CONFIDENTIAL • RESTRICTED TO ASTRA GROUND CREW
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold border border-hud-cyan text-hud-cyan bg-hud-cyan/15 hover:bg-hud-cyan/25 shadow-hud-cyan rounded-xs transition-colors"
          >
            DISMISS PROCEDURE
          </button>
        </div>
      </div>
    </div>
  )
}
