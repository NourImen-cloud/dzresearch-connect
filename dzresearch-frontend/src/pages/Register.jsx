import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authRegister } from '../services/api'
import './AuthPages.css'

export default function Register() {
  const navigate = useNavigate()
  const { setFromAuthPayload } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [researcherProfileId, setResearcherProfileId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      }
      const rid = researcherProfileId.trim()
      if (rid) body.researcher_profile_id = rid

      const data = await authRegister(body)
      setFromAuthPayload(data)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create an account</h1>
        <p className="auth-card__subtitle">
          Register with your OpenAlex author URL if you are in our catalog—we will link your account
          and mark your profile as claimed. If you are not listed yet, you can still register: your
          request stays in progress until we add you.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-openalex">OpenAlex profile (optional)</label>
            <input
              id="reg-openalex"
              type="url"
              placeholder="https://openalex.org/A…"
              value={researcherProfileId}
              onChange={e => setResearcherProfileId(e.target.value)}
            />
            <p className="auth-field__hint">
              Paste your OpenAlex author page URL. If it matches a profile in DZresearch, it becomes
              claimed on signup. If we do not have you yet, your account is still created and we will
              review your listing.
            </p>
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
