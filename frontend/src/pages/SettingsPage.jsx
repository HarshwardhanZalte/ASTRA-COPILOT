import Panel from '../components/Panel'

export default function SettingsPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-[10px] tracking-widest text-[#64748B] font-mono mb-0.5">SYSTEM / SETTINGS</div>
        <h1 className="text-lg font-semibold text-[#E5E7EB]">System Settings</h1>
      </div>
      <Panel title="CONFIGURATION">
        <div className="p-4 space-y-3">
          <div className="text-xs text-[#94A3B8]">
            Configure environment variables in <span className="font-mono text-[#38BDF8]">.env</span> file in the backend directory.
          </div>
          <div className="font-mono text-xs text-[#64748B] space-y-1 border border-[#263142] p-3">
            <div>DATABASE_URL=&lt;neon_connection_string&gt;</div>
            <div>GEMINI_API_KEY=&lt;gemini_api_key&gt;</div>
            <div>GEMINI_MODEL=gemini-2.5-flash</div>
            <div>EMBEDDING_MODEL=all-MiniLM-L6-v2</div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
