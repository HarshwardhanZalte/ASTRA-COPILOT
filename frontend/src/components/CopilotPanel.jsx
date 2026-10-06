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
      className={`flex min-h-0 flex-col overflow-hidden ${
        compact ? 'h-[340px] flex-none' : 'h-full min-h-[380px]'
      }`}
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
      <div
        ref={msgRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-3"
      >
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

      <div className="flex flex-shrink-0 gap-2 border-t border-[#263142] p-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask ASTRA Copilot..."
          aria-label="Message ASTRA Copilot"
          className="min-w-0 flex-1 bg-transparent border border-[#263142] px-3 py-1.5 text-xs text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]/50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          title="Send message"
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
      {r.insufficient_evidence && (
        <div className="px-2 py-1.5 border border-[#F59E0B]/40 bg-[#F59E0B]/5 text-[10px] text-[#F59E0B]">
          INSUFFICIENT EVIDENCE — no diagnosis or recommendation was generated.
        </div>
      )}
      {r.grounded_claims?.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-1 tracking-widest">EVIDENCE-LINKED CLAIMS</div>
          <ul className="space-y-0.5">
            {r.grounded_claims.map((claim, i) => (
              <li key={i} className="text-[10px] text-[#94A3B8] flex gap-1.5">
                <span className="text-[#64748B] flex-shrink-0">·</span>
                <span>
                  <span className="text-[#64748B] uppercase font-mono">
                    {claim.kind}:
                  </span>{' '}{claim.text}
                  <span className="ml-1 inline-flex gap-1">
                    {claim.citation_ids?.map(id => (
                      <span key={id} className="font-mono text-[#38BDF8]">[{id}]</span>
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.grounded_claims?.some(claim => claim.kind === 'recommendation') && (
        <div>
          <div className="mt-1.5 px-2 py-1 border border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[9px] font-mono text-[#F59E0B]">
            HUMAN APPROVAL REQUIRED — no spacecraft command is issued.
          </div>
        </div>
      )}
      {r.uncertainty && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-0.5 tracking-widest">UNCERTAINTY</div>
          <div className="text-[10px] text-[#94A3B8]">{r.uncertainty}</div>
        </div>
      )}
      {r.citations?.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-[#64748B] mb-1 tracking-widest">CITED EVIDENCE</div>
          <div className="space-y-1.5">
            {r.citations.map(citation => (
              <div key={citation.id} className="border border-[#263142] px-2 py-1.5">
                <div className="text-[9px] font-mono text-[#38BDF8]">
                  [{citation.id}] {citation.title} · {citation.source_type}
                </div>
                <div className="mt-0.5 text-[10px] text-[#94A3B8] whitespace-pre-wrap">
                  {citation.excerpt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
