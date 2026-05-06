import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getResearcher, getResearcherPapers, getRecommendations } from '../services/api'
import './ResearcherProfile.css'

export default function ResearcherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const [data,       setData]       = useState(null)
  const [papers,     setPapers]     = useState([])
  const [similar,    setSimilar]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    // Decode the ID (URL-encoded OpenAlex IDs)
    const decodedId = decodeURIComponent(id)

    Promise.all([
      getResearcher(decodedId),
      getResearcherPapers(decodedId),
      getRecommendations(decodedId, 6),
    ])
      .then(([profile, paps, recs]) => {
        setData(profile)
        setPapers(paps)
        setSimilar(recs)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} onBack={() => navigate(-1)} />

  return (
    <div className="rp">

      {/* ── HERO ─────────────────────────── */}
      <div className="rp-hero">
        <div className="rp-hero__dots" />
        <div className="rp-hero__inner">
          <div className="rp-hero__row">

            {/* Left — back button */}
            <div className="rp-hero__left">
              <button className="rp-back" onClick={() => navigate(-1)}>
                <ArrowLeftIcon /> Back
              </button>
            </div>

            {/* Right — avatar + details */}
            <div className="rp-hero__right">
              <div className="rp-hero__top">
                <div className="rp-hero__avatar">
                  <PersonIcon size={54} />
                </div>
                <div className="rp-hero__details">
                  <h1 className="rp-hero__name">{data.name}</h1>
                  <div className="rp-hero__meta">
                    <span><LocationIcon /> {data.institution}</span>
                    <span><LocationIcon /> {data.location}</span>
                    {data.country && <span>🌍 {data.country}</span>}
                  </div>
                  <p className="rp-hero__label">Research Interests</p>
                  <div className="rp-hero__topics">
                    {data.topics.map(t => <span key={t} className="rp-tag">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── STATS CARDS ─────────────────────────── */}
      <div className="rp-stats">
        <StatCard icon={<HIndexIcon />}   value={data.hIndex || 0}                        label="h-index"      />
        <StatCard icon={<CitationIcon />} value={(data.citations || 0).toLocaleString()}  label="Citations"    />
        <StatCard icon={<PaperSmIcon />}  value={papers.length || data.papers || 0}       label="Publications" />
        <StatCard
          icon={<LocationIcon />}
          value={data.location?.toLowerCase() === 'local' ? '🇩🇿 Local' : data.location?.toLowerCase() === 'diaspora' ? '✈️ Diaspora' : data.location || '—'}
          label="Location"
        />
      </div>

      {/* ── TABS ─────────────────────────── */}
      <div className="rp-tabs">
        <button
          className={`rp-tab ${activeTab === 'overview' ? 'rp-tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >Overview</button>
        <button
          className={`rp-tab ${activeTab === 'publications' ? 'rp-tab--active' : ''}`}
          onClick={() => setActiveTab('publications')}
        >Publications ({papers.length})</button>
      </div>

      {/* ── BODY ─────────────────────────── */}
      <div className="rp-body">

        {activeTab === 'overview' && (
          <>
            {/* Bio / Specialty */}
            {(data.bio || data.specialty) && (
              <div className="rp-section">
                <h2>About</h2>
                {data.specialty && <p><strong>Specialty:</strong> {data.specialty}</p>}
                {data.bio && <p>{data.bio}</p>}
              </div>
            )}

            <div className="rp-section">
              <div className="rp-section__header">
                <h2>Recent Publications</h2>
                <button className="rp-view-all" onClick={() => setActiveTab('publications')}>
                  View All <ChevronIcon />
                </button>
              </div>
              <div className="rp-papers">
                {papers.length === 0
                  ? <p style={{color:'#94a3b8'}}>No publications found in database.</p>
                  : papers.slice(0, 3).map(p => <PaperRow key={p.id} paper={p} />)
                }
              </div>
            </div>

            <div className="rp-section">
              <h2>Similar Researchers</h2>
              {similar.length === 0
                ? <p style={{color:'#94a3b8'}}>No recommendations available.</p>
                : (
                  <div className="rp-similar">
                    {similar.map(r => (
                      <div key={r.id} className="rp-similar__card"
                        onClick={() => navigate(`/researcher/${encodeURIComponent(r.id)}`)}>
                        <div className="rp-similar__avatar"><PersonIcon size={28} /></div>
                        <p className="rp-similar__name">{r.name}</p>
                        <p className="rp-similar__inst">{r.institution}</p>
                        <div className="rp-similar__topics">
                          {r.topics.slice(0,3).map(t => <span key={t} className="rp-tag rp-tag--sm">{t}</span>)}
                        </div>
                        {r.score && (
                          <span style={{fontSize:'0.72rem',color:'#f5a623',fontWeight:600}}>
                            {r.score}% match
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </>
        )}

        {activeTab === 'publications' && (
          <div className="rp-section">
            <h2>All Publications</h2>
            <div className="rp-papers">
              {papers.length === 0
                ? <p style={{color:'#94a3b8'}}>No publications found in database.</p>
                : papers.map(p => <PaperRow key={p.id} paper={p} />)
              }
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* ── Loading / Error states ──────────────────────────────────── */
function LoadingState() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',flexDirection:'column',gap:'1rem'}}>
      <div style={{width:48,height:48,border:'3px solid #1e3a5f',borderTopColor:'#f5a623',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'#64748b'}}>Loading researcher profile…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ErrorState({ message, onBack }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',flexDirection:'column',gap:'1rem',padding:'2rem'}}>
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.3">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3 style={{color:'#1e3a5f'}}>Could not load profile</h3>
      <p style={{color:'#64748b'}}>{message}</p>
      <button className="rp-back" onClick={onBack}><ArrowLeftIcon /> Go Back</button>
    </div>
  )
}

/* ── Paper Row ───────────────────────────────────────────────── */
function PaperRow({ paper }) {
  return (
    <div className="rp-paper">
      <div className="rp-paper__header">
        <h3 className="rp-paper__title">{paper.title}</h3>
      </div>
      <div className="rp-paper__tags">
        {paper.topics.slice(0,4).map(t => <span key={t} className="rp-tag rp-tag--sm">{t}</span>)}
      </div>
      {paper.abstract && <p className="rp-paper__abstract">{paper.abstract.slice(0, 200)}{paper.abstract.length > 200 ? '…' : ''}</p>}
      <div className="rp-paper__footer">
        {paper.year && <span>{paper.year}</span>}
        {paper.year && <span className="rp-paper__dot">•</span>}
        <span><CitationIcon /> {paper.citations} citations</span>
        {paper.source && <><span className="rp-paper__dot">•</span><span>{paper.source}</span></>}
      </div>
    </div>
  )
}

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ icon, value, label }) {
  return (
    <div className="rp-stat">
      <span className="rp-stat__icon">{icon}</span>
      <p className="rp-stat__value">{value}</p>
      <p className="rp-stat__label">{label}</p>
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────────── */
function PersonIcon({ size = 38 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function LocationIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function HIndexIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
}
function CitationIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function PaperSmIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
function ArrowLeftIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
}
function ChevronIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
}