import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Flame, Radio, Cpu, RotateCcw, AlertTriangle,
  Play, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, BookOpen, Clock
} from 'lucide-react'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import TelemetryChart from '../components/TelemetryChart'
import TimeTravelScrubber from '../components/TimeTravelScrubber'
import { useTelemetry } from '../hooks/useTelemetry'
import { useSimulator } from '../hooks/useSimulator'

const MISSION_SCENARIOS = [
  {
    id: 'battery_degradation',
    title: 'Battery Cell Degradation & Impedance Surge',
    subsystem: 'POWER',
    fault: 'battery_degradation',
    defaultSeverity: 'HIGH',
    icon: Zap,
    sop: 'PWR-PROC-001',
    description: 'Progressive capacity loss in secondary battery cells. Internal resistance causes voltage collapse under continuous bus load accompanied by cell overheating.',
    symptoms: [
      'Battery voltage drops (< 24.5V)',
      'Current spikes compensatorily (> 6.8A)',
      'Battery temperature elevates (+12°C)',
      'Subsystem power efficiency falls'
    ],
    expectedRootCause: 'Battery degradation',
  },
  {
    id: 'thermal_runaway',
    title: 'Avionics Thermal Runaway & Radiator Overload',
    subsystem: 'THERMAL',
    fault: 'thermal_runaway',
    defaultSeverity: 'HIGH',
    icon: Flame,
    sop: 'THM-PROC-002',
    description: 'Heat rejection failure on primary radiator loop. Compute node and payload bay temperatures rapidly escalate beyond maximum operating limits.',
    symptoms: [
      'CPU temp rises sharply (> 65°C)',
      'Payload temperature exceeds 40°C',
      'Power consumption increases due to cooling loops',
      'CPU clock throttling initiated'
    ],
    expectedRootCause: 'Thermal subsystem overload',
  },
  {
    id: 'communication_failure',
    title: 'Transponder Signal Fading & High Packet Loss',
    subsystem: 'COMMUNICATION',
    fault: 'communication_failure',
    defaultSeverity: 'HIGH',
    icon: Radio,
    sop: 'COM-PROC-003',
    description: 'RF amplifier degradation or ground station pointing offset causing severe carrier-to-noise attenuation, dropped telemetry frames, and high latency.',
    symptoms: [
      'Signal strength drops (< -95 dBm)',
      'Packet loss surges (> 35%)',
      'Link latency spikes (> 750ms)',
      'Command uplink retry cycles triggered'
    ],
    expectedRootCause: 'Communication link degradation',
  },
  {
    id: 'sensor_drift',
    title: 'Transducer Calibration Drift Bias',
    subsystem: 'COMPUTING',
    fault: 'sensor_drift',
    defaultSeverity: 'MEDIUM',
    icon: Cpu,
    sop: 'NAV-PROC-004',
    description: 'Subtle, creeping systematic error across voltage and thermal analog transducers, simulating sensor age degradation without abrupt hardware failure.',
    symptoms: [
      'Battery voltage slowly drifts +15% above actual',
      'CPU temperature sensor under-reports thermal load',
      'Cross-sensor parity discordance'
    ],
    expectedRootCause: 'Battery degradation / Sensor anomaly',
  },
]

export default function ScenariosPage() {
  const { telemetry, history, connected, faultInjectedAt, markFaultInjection } = useTelemetry(180)
  const { status, isRunning, start, injectFault, clearFault, reset, loading } = useSimulator()

  const [activeScenarioId, setActiveScenarioId] = useState(null)
  const [selectedSeverity, setSelectedSeverity] = useState('HIGH')
  const [executionPhase, setExecutionPhase] = useState('IDLE') // IDLE -> INJECTING -> ACTIVE -> RESOLVED
  const [selectedFrame, setSelectedFrame] = useState(null)

  const activeScenario = MISSION_SCENARIOS.find(s => s.id === activeScenarioId)
  const ml = telemetry?.ml || {}

  const handleLaunchScenario = async (scenario) => {
    setActiveScenarioId(scenario.id)
    setSelectedSeverity(scenario.defaultSeverity)
    setExecutionPhase('INJECTING')

    try {
      if (!status?.running) {
        await start()
      }
      markFaultInjection()
      await injectFault(scenario.fault, scenario.defaultSeverity)
      setExecutionPhase('ACTIVE')
    } catch (e) {
      console.error('Failed to launch scenario:', e)
      setExecutionPhase('IDLE')
    }
  }

  const handleClearScenario = async () => {
    try {
      await clearFault()
      setExecutionPhase('RESOLVED')
      setTimeout(() => {
        setExecutionPhase('IDLE')
        setActiveScenarioId(null)
      }, 2000)
    } catch (e) {
      console.error('Failed to clear scenario:', e)
    }
  }

  // Display telemetry for the selected historical frame or the live frame
  const displayTelemetry = selectedFrame != null && history[selectedFrame]
    ? history[selectedFrame]
    : telemetry

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="text-[10px] tracking-widest text-text-dim font-mono mb-0.5">
            MISSION SIMULATION • TESTBENCH & SCENARIO LAB
          </div>
          <h1 className="text-xl font-orbitron font-bold text-text-primary tracking-wide flex items-center gap-2">
            Mission Anomaly Scenarios
          </h1>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-3">
          {status?.fault_active && (
            <div className="flex items-center gap-2 px-3 py-1 border border-status-error/60 bg-status-error/15 rounded-xs animate-pulse">
              <ShieldAlert size={13} className="text-status-error" />
              <span className="text-xs font-mono font-bold text-status-error tracking-wider">
                ACTIVE SCENARIO RUNNING
              </span>
            </div>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold border border-border text-text-secondary bg-bg-panel hover:text-text-primary rounded-xs transition-colors"
          >
            <RotateCcw size={12} /> RESET SIMULATOR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Scenario Catalog */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-orbitron font-bold tracking-widest text-text-secondary uppercase px-1">
            AVAILABLE MISSION PROFILES ({MISSION_SCENARIOS.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MISSION_SCENARIOS.map(scenario => {
              const Icon = scenario.icon
              const isCurrent = activeScenarioId === scenario.id && status?.fault_active

              return (
                <Panel
                  key={scenario.id}
                  className={`transition-all duration-200 ${
                    isCurrent ? 'border-hud-cyan/80 bg-hud-cyan/5 shadow-hud-cyan' : 'hover:border-border-light'
                  }`}
                  glow={isCurrent}
                >
                  <div className="p-4 flex flex-col h-full justify-between space-y-3">
                    <div>
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-xs border ${
                            isCurrent ? 'border-hud-cyan text-hud-cyan bg-hud-cyan/20' : 'border-border text-text-dim bg-bg-secondary'
                          }`}>
                            <Icon size={14} />
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-text-dim uppercase">
                            {scenario.subsystem}
                          </span>
                        </div>
                        <StatusBadge status={scenario.defaultSeverity} />
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-display font-bold text-text-primary mb-1">
                        {scenario.title}
                      </h3>
                      <p className="text-[11px] font-sans text-text-secondary line-clamp-2 mb-3">
                        {scenario.description}
                      </p>

                      {/* Symptoms checklist */}
                      <div className="bg-bg-deep/60 p-2.5 rounded-xs border border-border/50 space-y-1">
                        <div className="text-[9px] font-orbitron font-bold text-text-dim uppercase mb-1">
                          EXPECTED SYMPTOMS:
                        </div>
                        {scenario.symptoms.map((sym, idx) => (
                          <div key={idx} className="text-[10px] font-mono text-text-secondary flex items-start gap-1.5">
                            <span className="text-hud-cyan font-bold">•</span>
                            <span>{sym}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-dim">
                        <BookOpen size={11} className="text-hud-cyan" />
                        <span>SOP: {scenario.sop}</span>
                      </div>

                      {isCurrent ? (
                        <button
                          onClick={handleClearScenario}
                          className="px-3 py-1 text-xs font-mono font-bold border border-status-error text-status-error bg-status-error/15 hover:bg-status-error/25 rounded-xs transition-all flex items-center gap-1"
                        >
                          CLEAR FAULT
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLaunchScenario(scenario)}
                          disabled={loading}
                          className="px-3 py-1 text-xs font-mono font-bold border border-hud-cyan text-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 shadow-hud-cyan rounded-xs transition-all flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <Play size={11} /> EXECUTE
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              )
            })}
          </div>
        </div>

        {/* Right Column: Live Telemetry Impact & Copilot Triage */}
        <div className="lg:col-span-5 space-y-4">
          <Panel
            title="REAL-TIME SCENARIO MONITOR"
            glow={Boolean(status?.fault_active)}
          >
            <div className="p-4 space-y-4">
              {/* Execution Phase Status */}
              <div className="flex items-center justify-between p-2.5 rounded-xs border border-border bg-bg-secondary/60 font-mono text-xs">
                <div>
                  <div className="text-[9px] text-text-dim uppercase">SIMULATION STATUS</div>
                  <div className="font-bold text-hud-cyan">
                    {status?.fault_active ? `FAULT ACTIVE (${status.fault_type})` : 'BASELINE NOMINAL'}
                  </div>
                </div>
                <StatusBadge
                  status={status?.fault_active ? 'CRITICAL' : 'OK'}
                  pulse={Boolean(status?.fault_active)}
                />
              </div>

              {/* Subsystem & Anomaly Gauges */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-2.5 rounded-xs border border-border/70 bg-bg-deep/50">
                  <div className="text-[9px] text-text-dim">ANOMALY SCORE</div>
                  <div className={`text-2xl font-orbitron font-extrabold ${
                    (ml.anomaly_score || 0) >= 0.7 ? 'text-status-error glow-red-text' :
                    (ml.anomaly_score || 0) >= 0.4 ? 'text-hud-amber glow-amber-text' :
                    'text-hud-cyan glow-cyan-text'
                  }`}>
                    {(ml.anomaly_score || 0).toFixed(2)}
                  </div>
                </div>

                <div className="p-2.5 rounded-xs border border-border/70 bg-bg-deep/50">
                  <div className="text-[9px] text-text-dim">ROOT CAUSE</div>
                  <div className="text-xs font-display font-bold text-text-primary line-clamp-1 mt-1">
                    {ml.root_cause || 'No Active Anomaly'}
                  </div>
                </div>
              </div>

              {/* Live Waveform Monitoring */}
              <div className="space-y-3">
                <div className="text-[10px] font-orbitron font-bold text-text-dim uppercase">
                  ACTIVE TELEMETRY WAVEFORMS
                </div>
                <div className="space-y-2">
                  <TelemetryChart
                    data={history}
                    field="battery_voltage"
                    label="Battery Voltage (V)"
                    height={100}
                    faultInjectedAt={faultInjectedAt}
                  />
                  <TelemetryChart
                    data={history}
                    field="cpu_temperature"
                    label="CPU Temperature (°C)"
                    height={100}
                    faultInjectedAt={faultInjectedAt}
                  />
                  <TelemetryChart
                    data={history}
                    field="communication_signal"
                    label="Signal Strength (dBm)"
                    height={100}
                    faultInjectedAt={faultInjectedAt}
                  />
                </div>
              </div>

              {/* Quick Link to Copilot Triage */}
              <div className="p-3 rounded-xs border border-hud-cyan/40 bg-hud-cyan/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-hud-cyan" />
                  <span className="text-xs font-mono text-text-primary">
                    Analyze with Mission Copilot
                  </span>
                </div>
                <Link
                  to="/copilot"
                  className="px-2.5 py-1 text-[10px] font-mono font-bold border border-hud-cyan text-hud-cyan bg-hud-cyan/15 hover:bg-hud-cyan/30 rounded-xs transition-colors flex items-center gap-1"
                >
                  OPEN COPILOT <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Bottom Row: Time-Travel Playback Scrubber */}
      <TimeTravelScrubber
        history={history}
        faultInjectedAt={faultInjectedAt}
        onSelectFrame={setSelectedFrame}
        selectedFrameIndex={selectedFrame}
      />
    </div>
  )
}
