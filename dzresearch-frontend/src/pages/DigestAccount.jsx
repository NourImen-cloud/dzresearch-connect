import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDigestSubscription,
  putDigestSubscription,
  getDigestPreview,
  postDigestSendTest,
} from '../services/api'
import './DigestAccount.css'

export default function DigestAccount() {
  const { token, isAuthenticated, email } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const [enabled, setEnabled] = useState(false)
  const [frequency, setFrequency] = useState('off')
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('All Countries')
  const [resultType, setResultType] = useState('All')
  const [topic, setTopic] = useState('All Topics')

  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }
    setLoading(true)
    getDigestSubscription(token)
      .then(s => {
        setEnabled(Boolean(s.enabled))
        setFrequency(s.frequency || 'off')
        setQuery(s.query || '')
        setCountry(s.country || 'All Countries')
        setResultType(s.result_type || 'All')
        setTopic(s.topic || 'All Topics')
      })
      .catch(() => setErr('Could not load subscription.'))
      .finally(() => setLoading(false))
  }, [isAuthenticated, token])

  async function save(e) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setErr('')
    setMsg('')
    try {
      await putDigestSubscription(token, {
        enabled,
        frequency,
        query,
        country,
        result_type: resultType,
        topic,
      })
      setMsg('Preferences saved.')
    } catch (ex) {
      setErr(ex.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function loadPreview() {
    if (!token) return
    setErr('')
    try {
      const p = await getDigestPreview(token)
      setPreview(p)
    } catch (ex) {
      setErr(ex.message || 'Preview failed')
    }
  }

  async function sendTest() {
    if (!token) return
    setErr('')
    setMsg('')
    try {
      const r = await postDigestSendTest(token)
      setMsg(r.detail || 'Sent.')
    } catch (ex) {
      setErr(ex.message || 'Send failed')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="digest-page">
        <div className="digest-card digest-card--guest">
          <h1>Weekly email digest</h1>
          <p className="digest-lead">
            This feature sends you an occasional email with a <strong>short list of papers and researchers</strong>{' '}
            that already exist in the DZresearch database — filtered by keywords you choose. It does{' '}
            <strong>not</strong> crawl the open web or social media.
          </p>
          <ol className="digest-steps digest-steps--plain">
            <li>You pick a query / topic (same idea as search filters).</li>
            <li>You can <strong>preview</strong> the email content anytime after logging in.</li>
            <li>If the server has email (SMTP) configured, you can receive a <strong>test</strong> or weekly send.</li>
          </ol>
          <p className="digest-guest-cta">
            <Link to="/login" className="digest-guest-link">Log in</Link>
            {' · '}
            <Link to="/register" className="digest-guest-link">Create an account</Link>
            {' '}to set up your digest.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="digest-page">
      <div className="digest-card">
        <h1>Weekly email digest</h1>
        <p className="digest-kicker">From our catalog → your inbox</p>

        <div className="digest-explain">
          <h2 className="digest-explain__title">What you get</h2>
          <ul className="digest-explain__list">
            <li>
              <strong>Content:</strong> a small HTML email listing papers (title, year) and researchers (name,
              institution) that match your saved <em>query / topic</em> using simple text search over the data we host.
            </li>
            <li>
              <strong>Preview:</strong> use the button below — no email is required to see what would be sent.
            </li>
            <li>
              <strong>Delivery:</strong> “Send test email” goes to <strong>{email}</strong> only if SMTP is
              configured on the server. Weekly sends need your checkbox + frequency and (for automation) a scheduled call
              to the digest API.
            </li>
          </ul>
        </div>

        <p className="digest-lead digest-lead--tight">
          Adjust filters, save, then preview or send a test. Turn on the checkbox and choose <strong>Weekly</strong>{' '}
          when you want recurring mail (server must support SMTP).
        </p>

        {loading && <p className="digest-muted">Loading…</p>}

        {!loading && (
          <form className="digest-form" onSubmit={save}>
            <h2 className="digest-form__heading">Your digest filters</h2>
            <label className="digest-check">
              <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
              I want weekly digest emails (requires SMTP on the server)
            </label>

            <label className="digest-field">
              <span>Frequency</span>
              <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="off">Off (save filters only)</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>

            <label className="digest-field">
              <span>Search query</span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. machine learning" />
            </label>

            <label className="digest-field">
              <span>Country filter</span>
              <input value={country} onChange={e => setCountry(e.target.value)} />
            </label>

            <label className="digest-field">
              <span>Result type</span>
              <select value={resultType} onChange={e => setResultType(e.target.value)}>
                <option>All</option>
                <option>Researcher</option>
                <option>Paper</option>
              </select>
            </label>

            <label className="digest-field">
              <span>Topic</span>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="All Topics" />
            </label>

            {err && <p className="digest-error">{err}</p>}
            {msg && <p className="digest-success">{msg}</p>}

            <div className="digest-actions">
              <button type="submit" className="digest-btn digest-btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save preferences'}
              </button>
              <button type="button" className="digest-btn" onClick={loadPreview}>
                Preview email (no send)
              </button>
              <button type="button" className="digest-btn" onClick={sendTest} title={`Send one digest to ${email}`}>
                Send test email
              </button>
            </div>
          </form>
        )}

        <p className="digest-hint">
          Server email uses <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>,{' '}
          <code>SMTP_PASSWORD</code>, <code>SMTP_FROM_EMAIL</code>, and optional{' '}
          <code>SMTP_FROM_NAME</code> (or legacy <code>SMTP_FROM</code> for the address only). Put them in a{' '}
          <code>.env</code> file at the project root (gitignored) or in your process environment. Scheduled sends can call{' '}
          <code>POST /digests/cron/send-due</code> with header <code>X-Cron-Secret</code> matching{' '}
          <code>DIGEST_CRON_SECRET</code>.
        </p>

        {preview && (
          <div className="digest-preview">
            <h2>Preview — {preview.subject}</h2>
            <p>{preview.intro}</p>
            <h3>Papers</h3>
            <ul>
              {preview.papers?.map(p => (
                <li key={p.id}>
                  {p.title} ({p.year ?? '—'})
                </li>
              ))}
            </ul>
            <h3>Researchers</h3>
            <ul>
              {preview.researchers?.map(r => (
                <li key={r.id}>
                  {r.name} — {r.institution}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
