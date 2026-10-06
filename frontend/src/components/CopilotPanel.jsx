import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, AlertTriangle, BookOpen, ShieldCheck, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react'
import { copilotApi } from '../services/api'
import Panel from './Panel'
import ProcedureModal from './ProcedureModal'

const SUGGESTED_QUESTIONS = [
  'Why did this anomaly occur?',
  'What telemetry evidence supports the diagnosis?',
  'What should the operator investigate next?',
  'Which flight procedure (SOP) applies?',
  'How do we safely resolve battery degradation?'
]

export default function CopilotPanel({ incidentId = null, compact = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('DEMO')
  const [selectedDocId, setSelectedDocId] = useState(null)
  const msgRef = useRef(null)

  useEffect(() => {
    copilotApi.getMode().then(m => setMode(m.mode)).catch(() => {})
  }, [])

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight
  }, [messages])

  const sendMessage = async (question) => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await copilotApi.chat(q, incidentId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, raw: res }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'error', content: 'Copilot unavailable. Check backend connection.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <Panel
        title="MISSION OPERATIONS COPILOT"
        className="flex flex-col h-full"
        glow={true}
        headerRight={
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded-xs ${
              mode === 'GEMINI'
                ? 'border-hud-emerald/50 text-hud-emerald bg-hud-emerald/10'
                : 'border-hud-amber/50 text-hud-amber bg-hud-amber/10'
            }`}>
              AI ENGINE: {mode}
            </span>
          </div>
        }
      >
        {/* Messages feed */}
        <div
          ref={msgRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ minHeight: 0, maxHeight: compact ? '320px' : '480px' }}
        >
          {messages.length === 0 && (
            <div className="space-y-3 py-2">
              <div className="p-3 border border-hud-cyan/30 bg-hud-cyan/5 rounded-xs flex items-center gap-2.5 text-xs text-text-primary">
                <Sparkles size={16} className="text-hud-cyan flex-shrink-0" />
                <span className="leading-snug">
                  ASTRA Mission Copilot is grounded in flight rules, telemetry snapshots, and standard operating procedures.
                </span>
              </div>

              <div className="text-[10px] font-orbitron font-bold text-text-dim uppercase tracking-wider">
                SUGGESTED OPERATIONAL INQUIRIES:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left px-3 py-2 text-[11px] font-mono text-text-secondary border border-border bg-bg-secondary/40 hover:border-hud-cyan/60 hover:text-hud-cyan hover:bg-bg-panel transition-all rounded-xs flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ChevronRight size={12} className="text-text-dim group-hover:text-hud-cyan transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-md bg-hud-cyan/15 border border-hud-cyan/40 px-3.5 py-2 text-xs font-mono text-text-primary rounded-xs shadow-hud-cyan">
                    {msg.content}
                  </div>
                </div>
              )}
              {msg.role === 'assistant' && (
                <AssistantMessage
                  response={msg.content}
                  onOpenDoc={(docId) => setSelectedDocId(docId)}
                />
              )}
              {msg.role === 'error' && (
                <div className="text-xs font-mono text-status-error px-3 py-2 border border-status-error/40 bg-status-error/10 rounded-xs">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs font-mono text-hud-cyan p-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-hud-cyan rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span>Grounding telemetry & synthesizing flight procedures...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-border p-3 flex gap-2 bg-bg-secondary/70">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask Copilot about telemetry, root cause, or SOPs..."
            className="flex-1 bg-bg-panel/70 border border-border px-3.5 py-2 text-xs font-mono text-text-primary placeholder-text-dim focus:outline-none focus:border-hud-cyan/70 rounded-xs"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-3.5 py-2 border border-hud-cyan text-hud-cyan bg-hud-cyan/10 hover:bg-hud-cyan/20 disabled:opacity-40 transition-all rounded-xs flex items-center justify-center font-bold"
          >
            <Send size={13} />
          </button>
        </div>
      </Panel>

      {/* Interactive Procedure SOP Modal */}
      {selectedDocId && (
        <ProcedureModal
          docId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
        />
      )}
    </>
  )
}

function AssistantMessage({ response, onOpenDoc }) {
  if (!response) return null
  const r = response

  return (
    <div className="space-y-3 border-l-2 border-hud-cyan/60 pl-3.5 py-1 font-mono text-xs">
      {/* Summary */}
      {r.summary && (
        <div className="space-y-1">
          <div className="text-[9px] font-orbitron font-bold text-hud-cyan tracking-widest uppercase">
            OPERATIONAL ASSESSMENT
          </div>
          <div className="text-xs text-text-primary leading-relaxed font-sans bg-bg-panel/40 p-2.5 rounded-xs border border-border/60">
            {r.summary}
          </div>
        </div>
      )}

      {/* Observed Facts */}
      {r.observed_facts?.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-orbitron font-bold text-text-dim tracking-widest uppercase">
            OBSERVED TELEMETRY SIGNALS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {r.observed_facts.map((f, i) => (
              <div key={i} className="text-[10px] text-text-secondary bg-bg-secondary/40 border border-border/50 p-1.5 rounded-xs flex items-start gap-1.5">
                <span className="text-hud-cyan font-bold">•</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root Cause & Confidence */}
      {r.root_cause && (
        <div className="p-2.5 rounded-xs border border-border/70 bg-bg-deep/70 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-orbitron font-bold text-text-dim tracking-wider uppercase">
              PROBABLE ROOT CAUSE
            </div>
            <div className="text-xs font-display font-bold text-text-primary mt-0.5">
              {r.root_cause}
            </div>
          </div>
          {r.root_cause_confidence && (
            <div className="text-right">
              <span className="text-[12px] font-orbitron font-extrabold text-hud-cyan glow-cyan-text">
                {Math.round(r.root_cause_confidence * 100)}%
              </span>
              <div className="text-[8px] text-text-dim">CONFIDENCE</div>
            </div>
          )}
        </div>
      )}

      {/* Actionable Recommendations */}
      {r.recommendations?.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] font-orbitron font-bold text-text-dim tracking-widest uppercase">
            RECOMMENDED ACTION PROTOCOL
          </div>
          <div className="space-y-1">
            {r.recommendations.map((rec, i) => (
              <div key={i} className="text-[11px] text-text-primary bg-bg-panel/50 border border-border/60 p-2 rounded-xs flex items-start gap-2">
                <span className="px-1 py-0.2 bg-hud-cyan/20 text-hud-cyan font-bold text-[9px] rounded-xs flex-shrink-0">
                  {i + 1}
                </span>
                <span className="font-sans leading-snug">{rec}</span>
              </div>
            ))}
          </div>
          <div className="px-2.5 py-1 border border-hud-amber/40 bg-hud-amber/10 text-[9px] font-mono text-hud-amber rounded-xs flex items-center gap-1.5 font-bold">
            <AlertTriangle size={12} />
            <span>HUMAN OPERATOR AUTHORIZATION REQUIRED PRIOR TO COMMAND UPLINK</span>
          </div>
        </div>
      )}

      {/* Uncertainty */}
      {r.uncertainty && (
        <div className="space-y-0.5">
          <div className="text-[9px] font-orbitron font-bold text-text-dim tracking-widest uppercase">
            UNCERTAINTY & BOUNDS
          </div>
          <div className="text-[10px] text-text-secondary italic bg-bg-secondary/30 p-2 rounded-xs border border-border/40">
            {r.uncertainty}
          </div>
        </div>
      )}

      {/* SOP Document Citations */}
      {r.sources?.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/50">
          <div className="text-[9px] font-orbitron font-bold text-text-dim tracking-widest uppercase">
            DOCUMENT SOURCES & PROCEDURES (CLICK TO VIEW)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {r.sources.map((s, i) => (
              <button
                key={i}
                onClick={() => onOpenDoc && onOpenDoc(s)}
                className="text-[10px] font-mono text-hud-cyan border border-hud-cyan/40 bg-hud-cyan/10 hover:bg-hud-cyan/25 px-2 py-0.5 rounded-xs transition-colors flex items-center gap-1 shadow-hud-cyan"
              >
                <BookOpen size={10} />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
