import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendChatMessage } from '../services/api'
import './Chatbot.css'

const starterQuestions = [
  'Find researchers in NLP',
  'Show papers about machine learning',
  'Find both researchers and papers in computer vision',
  'Who works on machine learning?',
]

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi, I'm the DZ Research Assistant. Ask me about researchers, papers, or both in a specific field.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submitMessage(textFromButton) {
    const text = (textFromButton || input).trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const data = await sendChatMessage(text)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || data.reply,
          researchers: data.researchers || [],
          papers: data.papers || [],
          query: data.query,
        },
      ])
    } catch (err) {
      setError('Could not reach the chatbot backend. Make sure FastAPI is running on port 8001.')
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'I could not connect to the backend right now.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    submitMessage()
  }

  return (
    <main className="chat-page">
      <section className="chat-hero">
        <div className="chat-hero__dots" />
        <div className="chat-hero__content">
          <p className="chat-kicker">AI Research Assistant</p>
          <h1>Ask about researchers and papers</h1>
          <p>
            A simple backend-powered assistant that searches the platform database for researchers,
            papers, or both based on your question.
          </p>
        </div>
      </section>

      <section className="chat-shell">
        <aside className="chat-help">
          <h2>Try asking</h2>
          <div className="chat-suggestions">
            {starterQuestions.map(q => (
              <button key={q} type="button" onClick={() => submitMessage(q)}>
                {q}
              </button>
            ))}
          </div>

        </aside>

        <div className="chat-panel">
          <div className="chat-messages" aria-live="polite">
            {messages.map((m, idx) => (
              <MessageBubble key={idx} message={m} />
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble--assistant">
                <span className="chat-loader" /> Searching the database...
              </div>
            )}
          </div>

          {error && <p className="chat-error">{error}</p>}

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Example: find papers about NLP"
              aria-label="Chat message"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}>
      <p>{message.text}</p>

      {!isUser && message.researchers?.length > 0 && (
        <div className="chat-results">
          <h3>Researchers</h3>
          {message.researchers.map(r => (
            <Link to={`/researcher/${encodeURIComponent(r.id)}`} className="chat-result-card" key={r.id}>
              <strong>{r.name}</strong>
              <span>{r.institution} · {r.location}</span>
              <small>{r.paper_count} papers {r.is_claimed ? '· Claimed' : '· Unclaimed'}</small>
              {r.topics && <em>{r.topics}</em>}
            </Link>
          ))}
        </div>
      )}

      {!isUser && message.papers?.length > 0 && (
        <div className="chat-results">
          <h3>Papers</h3>
          {message.papers.map(p => (
            <Link to={`/paper/${encodeURIComponent(p.id)}`} className="chat-result-card" key={p.id}>
              <strong>{p.title}</strong>
              <span>{p.year || 'Unknown year'}</span>
              {p.concepts && <em>{p.concepts}</em>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
