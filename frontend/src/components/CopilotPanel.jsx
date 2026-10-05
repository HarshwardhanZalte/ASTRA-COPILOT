import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { copilotApi } from '../services/api'
import Panel from './Panel'

const SUGGESTED_QUESTIONS = [
  'Why did this anomaly occur?',
  'What evidence supports the diagnosis?',
  'What should the operator investigate next?',
  'Which procedure applies?',
]

export default function CopilotPanel({ incidentId = null, compact = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('DEMO')
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
    <Panel
      title="MISSION COPILOT"
      className="flex flex-col"
      headerRight={
        <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${
          mode === 'GEMINI'
            ? 'border-[#22C55E]/40 text-[#22C55E]'
            : 'border-[#F59E0B]/40 text-[#F59E0B]'
        }`}>
          MODE: {mode}
        </span>
      }
    >
      <div ref={msgRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0, maxHeight: compact ? '280px' : '380px' }}>
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="text-[10px] text-[#64748B] mb-2">Suggested questions:</div>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="block w-full text-left px-2.5 py-2 text-[11px] text-[#94A3B8] border border-[#263142] hover:border-[#38BDF8]/50 hover:text-[#E5E7EB] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-xs bg-[#38BDF8]/10 border border-[#38BDF8]/20 px-3 py-2 text-xs text-[#E5E7EB]">
                  {msg.content}
                </div>
              </div>
            )}
            {msg.role === 'assistant' && (
              <AssistantMessage response={msg.content} />
            )}
            {msg.role === 'error' && (
              <div className="text-xs text-[#EF4444] px-2">{msg.content}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <div className="flex gap-0.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1 h-1 bg-[#38BDF8] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            Processing...
          </div>
        )}
      </div>

      <div className="border-t border-[#263142] p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask ASTRA Copilot..."
          className="flex-1 bg-transparent border border-[#263142] px-3 py-1.5 text-xs text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]/50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="p-1.5 border border-[#263142] text-[#64748B] hover:text-[#38BDF8] hover:border-[#38BDF8]/50 disabled:opacity-40 transition-colors"
        >
          <Send size={13} />
        </button>
      </div>
    </Panel>
  )
}

function AssistantMessage({ response }) {
  if (!response) return null
  const r = response

  return (
    <div className="space-y-2 border-l-2 border-[#38BDF8]/40 pl-3">
      {r.summary && (
        <div>
          <div className="text-[9px] font-mono text-[#38BDF8] mb-0.5 tracking-widest">SUMMARY</div>
          <div className="text-xs text-[#E5E7EB]">{r.summary}</div>
        </div>
      )}
      {r.observed_facts?.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-0.5 tracking-widest">OBSERVED FACTS</div>
          <ul className="space-y-0.5">
            {r.observed_facts.map((f, i) => (
              <li key={i} className="text-[10px] text-[#94A3B8] flex gap-1.5">
                <span className="text-[#64748B] flex-shrink-0">·</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.root_cause && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-0.5 tracking-widest">ROOT CAUSE</div>
          <div className="text-[11px] text-[#E5E7EB] font-semibold">{r.root_cause}</div>
          {r.root_cause_confidence && (
            <div className="text-[10px] font-mono text-[#38BDF8]">{Math.round(r.root_cause_confidence * 100)}% confidence</div>
          )}
        </div>
      )}
      {r.recommendations?.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-0.5 tracking-widest">RECOMMENDATIONS</div>
          <ul className="space-y-0.5">
            {r.recommendations.map((rec, i) => (
              <li key={i} className="text-[10px] text-[#94A3B8] flex gap-1.5">
                <span className="text-[#38BDF8] flex-shrink-0">{i + 1}.</span>{rec}
              </li>
            ))}
          </ul>
          <div className="mt-1.5 px-2 py-1 border border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[9px] font-mono text-[#F59E0B]">
            ⚠ HUMAN APPROVAL REQUIRED
          </div>
        </div>
      )}
      {r.uncertainty && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-0.5 tracking-widest">UNCERTAINTY</div>
          <div className="text-[10px] text-[#94A3B8]">{r.uncertainty}</div>
        </div>
      )}
      {r.sources?.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-0.5 tracking-widest">SOURCES</div>
          <div className="flex flex-wrap gap-1">
            {r.sources.map((s, i) => (
              <span key={i} className="text-[9px] font-mono text-[#64748B] border border-[#263142] px-1.5 py-0.5">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
