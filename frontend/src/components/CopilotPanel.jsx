import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Send,
  Sparkles,
} from 'lucide-react'
import { copilotApi } from '../services/api'
import Panel from './Panel'
import ProcedureModal from './ProcedureModal'

const SUGGESTED_QUESTIONS = [
  'Why did this anomaly occur?',
  'What telemetry evidence supports the diagnosis?',
  'What should the operator investigate next?',
  'Which flight procedure (SOP) applies?',
  'How do we safely resolve battery degradation?',
]

export default function CopilotPanel({ incidentId = null, compact = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('DEMO')
  const [selectedDocId, setSelectedDocId] = useState(null)
  const msgRef = useRef(null)

  useEffect(() => {
    copilotApi.getMode().then(result => setMode(result.mode)).catch(() => {})
  }, [])

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight
  }, [messages, loading])

  const sendMessage = async (question) => {
    const text = question.trim()
    if (!text || loading) return

    setInput('')
    setMessages(previous => [...previous, { role: 'user', content: text }])
    setLoading(true)
    try {
      const result = await copilotApi.chat(text, incidentId)
      setMessages(previous => [
        ...previous,
        { role: 'assistant', content: result.response },
      ])
    } catch (error) {
      console.error('Copilot request failed:', error)
      setMessages(previous => [
        ...previous,
        { role: 'error', content: 'Copilot unavailable. Check the backend connection and try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Panel
        title="MISSION OPERATIONS COPILOT"
        className={`flex min-h-0 flex-col overflow-hidden ${
          compact ? 'h-[340px] flex-none' : 'h-full'
        }`}
        glow
        headerRight={
          <span className={`rounded-xs border px-2 py-0.5 text-[9px] font-mono font-bold ${
            mode === 'GEMINI'
              ? 'border-hud-emerald/50 bg-hud-emerald/10 text-hud-emerald'
              : 'border-hud-amber/50 bg-hud-amber/10 text-hud-amber'
          }`}>
            AI ENGINE: {mode}
          </span>
        }
      >
        <div
          ref={msgRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4"
        >
          {messages.length === 0 && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2.5 rounded-xs border border-hud-cyan/30 bg-hud-cyan/5 p-3 text-xs text-text-primary">
                <Sparkles size={16} className="flex-shrink-0 text-hud-cyan" />
                <span className="leading-snug">
                  ASTRA Mission Copilot uses retrieved telemetry and mission documents. Claims include citations; unsupported questions are declined.
                </span>
              </div>
              <div className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-text-dim">
                SUGGESTED OPERATIONAL INQUIRIES:
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map(question => (
                  <button
                    key={question}
                    onClick={() => sendMessage(question)}
                    disabled={loading}
                    className="group flex items-center justify-between rounded-xs border border-border bg-bg-secondary/40 px-3 py-2 text-left text-[11px] font-mono text-text-secondary transition-all hover:border-hud-cyan/60 hover:bg-bg-panel hover:text-hud-cyan disabled:opacity-50"
                  >
                    <span>{question}</span>
                    <ChevronRight size={12} className="text-text-dim transition-colors group-hover:text-hud-cyan" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              {message.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] break-words rounded-xs border border-hud-cyan/40 bg-hud-cyan/15 px-3.5 py-2 text-xs font-mono text-text-primary">
                    {message.content}
                  </div>
                </div>
              )}
              {message.role === 'assistant' && (
                <AssistantMessage
                  response={message.content}
                  onOpenDoc={setSelectedDocId}
                />
              )}
              {message.role === 'error' && (
                <div className="rounded-xs border border-status-error/40 bg-status-error/10 px-3 py-2 text-xs font-mono text-status-error">
                  {message.content}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 p-2 text-xs font-mono text-hud-cyan">
              <div className="flex gap-1">
                {[0, 1, 2].map(index => (
                  <div
                    key={index}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-hud-cyan"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  />
                ))}
              </div>
              <span>Grounding telemetry & synthesizing flight procedures...</span>
            </div>
          )}
        </div>

        <form
          onSubmit={event => {
            event.preventDefault()
            sendMessage(input)
          }}
          className="flex flex-shrink-0 gap-2 border-t border-border bg-bg-secondary/70 p-3"
        >
          <input
            type="text"
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Ask Copilot about telemetry, root cause, or SOPs..."
            aria-label="Message ASTRA Copilot"
            className="min-w-0 flex-1 rounded-xs border border-border bg-bg-panel/70 px-3.5 py-2 text-xs font-mono text-text-primary placeholder-text-dim focus:border-hud-cyan/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            title="Send message"
            className="flex items-center justify-center rounded-xs border border-hud-cyan bg-hud-cyan/10 px-3.5 py-2 font-bold text-hud-cyan transition-all hover:bg-hud-cyan/20 disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </form>
      </Panel>

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
  const result = response
  const citations = result.citations || []

  return (
    <div className="space-y-3 border-l-2 border-hud-cyan/60 py-1 pl-3.5 font-mono text-xs">
      {result.summary && (
        <div className="space-y-1">
          <div className="text-[9px] font-orbitron font-bold uppercase tracking-widest text-hud-cyan">
            OPERATIONAL ASSESSMENT
          </div>
          <div className="break-words rounded-xs border border-border/60 bg-bg-panel/40 p-2.5 font-sans text-xs leading-relaxed text-text-primary">
            {result.summary}
          </div>
        </div>
      )}

      {result.insufficient_evidence && (
        <div className="flex items-start gap-2 rounded-xs border border-hud-amber/40 bg-hud-amber/10 px-2.5 py-2 text-[10px] font-bold text-hud-amber">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          <span>INSUFFICIENT EVIDENCE — no diagnosis or recommendation was generated.</span>
        </div>
      )}

      {result.grounded_claims?.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-orbitron font-bold uppercase tracking-widest text-text-dim">
            EVIDENCE-LINKED CLAIMS
          </div>
          <div className="space-y-1.5">
            {result.grounded_claims.map((claim, index) => (
              <div key={`${claim.kind}-${index}`} className="break-words rounded-xs border border-border/50 bg-bg-secondary/40 p-2 text-[10px] text-text-secondary">
                <span className="mr-1 font-bold uppercase text-hud-cyan">{claim.kind}:</span>
                {claim.text}
                <span className="ml-1 inline-flex gap-1">
                  {claim.citation_ids?.map(citationId => (
                    <a
                      key={citationId}
                      href={`#${citationId}`}
                      className="font-bold text-hud-cyan hover:underline"
                    >
                      [{citationId}]
                    </a>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.recommendations?.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-xs border border-hud-amber/40 bg-hud-amber/10 px-2.5 py-1.5 text-[9px] font-mono font-bold text-hud-amber">
          <AlertTriangle size={12} />
          HUMAN OPERATOR AUTHORIZATION REQUIRED
        </div>
      )}

      {result.uncertainty && (
        <div className="space-y-0.5">
          <div className="text-[9px] font-orbitron font-bold uppercase tracking-widest text-text-dim">
            UNCERTAINTY & BOUNDS
          </div>
          <div className="rounded-xs border border-border/40 bg-bg-secondary/30 p-2 text-[10px] italic text-text-secondary">
            {result.uncertainty}
          </div>
        </div>
      )}

      {citations.length > 0 && (
        <div className="space-y-1 border-t border-border/50 pt-2">
          <div className="text-[9px] font-orbitron font-bold uppercase tracking-widest text-text-dim">
            CITED EVIDENCE
          </div>
          {citations.map(citation => (
            <div
              key={citation.id}
              id={citation.id}
              className="scroll-mt-2 rounded-xs border border-border/60 bg-bg-panel/50 p-2"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-hud-cyan">
                <span>[{citation.id}]</span>
                {citation.source_type === 'procedure' ? (
                  <button
                    type="button"
                    onClick={() => onOpenDoc(citation.source_id)}
                    className="inline-flex items-center gap-1 text-left hover:underline"
                  >
                    <BookOpen size={10} />
                    {citation.title}
                  </button>
                ) : (
                  <span>{citation.title}</span>
                )}
                <span className="font-normal text-text-dim">· {citation.source_type}</span>
              </div>
              <div className="mt-1 whitespace-pre-wrap break-words text-[10px] text-text-secondary">
                {citation.excerpt}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
