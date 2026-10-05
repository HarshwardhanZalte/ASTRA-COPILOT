import Panel from '../components/Panel'

export default function ScenariosPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-[10px] tracking-widest text-[#64748B] font-mono mb-0.5">SIMULATION / SCENARIOS</div>
        <h1 className="text-lg font-semibold text-[#E5E7EB]">Fault Scenarios</h1>
      </div>
      <Panel>
        <div className="p-8 text-sm text-[#64748B] text-center">
          Use the Anomaly Simulator page to inject fault scenarios.
        </div>
      </Panel>
    </div>
  )
}
