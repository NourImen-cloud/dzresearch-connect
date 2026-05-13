import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import NetworkGraph from '../components/Networkgrapgh'
import { useAuth } from '../context/AuthContext'
import {
  getResearcher,
  getResearcherPapers,
  getRecommendations,
  getCollaborationEgo,
  patchProfile,
  normalizeResearcher,
} from '../services/api'
import './ResearcherProfile.css'

export default function ResearcherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, linkedResearcherId } = useAuth()
  const decodedId = useMemo(() => (id ? decodeURIComponent(id) : ''), [id])

  const [activeTab, setActiveTab] = useState('overview')

  const [data,       setData]       = useState(null)
  const [papers,     setPapers]     = useState([])
  const [similar,    setSimilar]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const [collabNodes, setCollabNodes] = useState([])
  const [collabEdges, setCollabEdges] = useState([])
  const [collabLoading, setCollabLoading] = useState(false)
  const [collabError, setCollabError] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '', specialty: '', website: '', orcid: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    const decoded = decodeURIComponent(id)
    let cancelled = false

    ;(async () => {
      try {
        const profile = await getResearcher(decoded)
        if (cancelled) return
        setData(profile)

        const [paps, recs] = await Promise.all([
          getResearcherPapers(decoded).catch(() => []),
          getRecommendations(decoded, 6).catch(() => []),
        ])
        if (cancelled) return
        setPapers(Array.isArray(paps) ? paps : [])
        setSimilar(Array.isArray(recs) ? recs : [])
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Could not load profile')
        setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (activeTab !== 'collaboration' || !decodedId) return
    setCollabLoading(true)
    setCollabError(null)
    getCollaborationEgo(decodedId, 50)
      .then(g => {
        setCollabNodes(
          (g.nodes || []).map(n => ({
            id: n.id,
            name: n.label,
            location: n.location,
            papers: n.papers,
          }))
        )
        setCollabEdges(
          (g.edges || []).map(e => ({
            source: e.source,
            target: e.target,
            weight: e.weight,
          }))
        )
      })
      .catch(err => setCollabError(err.message))
      .finally(() => setCollabLoading(false))
  }, [activeTab, decodedId])

  useEffect(() => {
    if (!editOpen || !data) return
    setEditForm({
      bio: data.bio || '',
      specialty: data.specialty || '',
      website: data.website || '',
      orcid: data.orcid || '',
    })
    setEditError(null)
  }, [editOpen, data])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} onBack={() => navigate(-1)} />

  const canEdit = Boolean(
    token &&
      data?.isClaimed &&
      linkedResearcherId &&
      decodedId === linkedResearcherId
  )

  async function saveProfile(e) {
    e.preventDefault()
    if (!token || !decodedId) return
    setEditSaving(true)
    setEditError(null)
    try {
      const raw = await patchProfile(decodedId, token, {
        bio: editForm.bio,
        specialty: editForm.specialty,
        website: editForm.website,
        orcid: editForm.orcid,
      })
      setData(normalizeResearcher(raw))
      setEditOpen(false)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

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
                  <div className="rp-hero__title-row">
                    <h1 className="rp-hero__name">{data.name}</h1>
                    <span
                      className={
                        data.isClaimed
                          ? 'rp-profile-badge rp-profile-badge--claimed'
                          : 'rp-profile-badge rp-profile-badge--unclaimed'
                      }
                    >
                      {data.isClaimed ? 'Claimed' : 'Unclaimed'}
                    </span>
                  </div>
                  <div className="rp-hero__meta">
                    <span><LocationIcon /> {data.institution}</span>
                    <span><LocationIcon /> {data.location}</span>
                    {data.country && <span>🌍 {data.country}</span>}
                  </div>
                  <p className="rp-hero__label">Research Interests</p>
                  <div className="rp-hero__topics">
                    {data.topics.map(t => <span key={t} className="rp-tag">{t}</span>)}
                  </div>
                  <div className="rp-hero__quick-nav">
                    <button
                      type="button"
                      className="rp-hero__quick-btn"
                      onClick={() => setActiveTab('overview')}
                      aria-current={activeTab === 'overview' ? 'true' : undefined}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      className="rp-hero__quick-btn"
                      onClick={() => setActiveTab('publications')}
                      aria-current={activeTab === 'publications' ? 'true' : undefined}
                    >
                      Publications
                    </button>
                    <button
                      type="button"
                      className="rp-hero__quick-btn rp-hero__quick-btn--accent"
                      onClick={() => setActiveTab('collaboration')}
                      title="Researchers who share papers with this person in our database"
                      aria-current={activeTab === 'collaboration' ? 'true' : undefined}
                    >
                      Co-authors
                    </button>
                  </div>
                  {(data.website || data.orcid || canEdit) && (
                    <div className="rp-hero__links">
                      {data.website && (
                        <a
                          className="rp-hero__link"
                          href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Website
                        </a>
                      )}
                      {data.orcid && (
                        <a
                          className="rp-hero__link"
                          href={data.orcid.startsWith('http') ? data.orcid : `https://orcid.org/${data.orcid.replace(/^https?:\/\/orcid\.org\//, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ORCID
                        </a>
                      )}
                      {canEdit && (
                        <button type="button" className="rp-edit-profile" onClick={() => setEditOpen(true)}>
                          Edit profile
                        </button>
                      )}
                    </div>
                  )}
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
          type="button"
          onClick={() => setActiveTab('overview')}
        >
          <span className="rp-tab__line1">Overview</span>
        </button>
        <button
          className={`rp-tab ${activeTab === 'publications' ? 'rp-tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('publications')}
        >
          <span className="rp-tab__line1">Publications ({papers.length})</span>
        </button>
        <button
          className={`rp-tab ${activeTab === 'collaboration' ? 'rp-tab--active' : ''}`}
          type="button"
          title="People who share at least one paper with this researcher in our database (real co-authorship)"
          onClick={() => setActiveTab('collaboration')}
        >
          <span className="rp-tab__line1">Co-authors</span>
          <span className="rp-tab__line2">shared papers</span>
        </button>
      </div>

      {/* ── BODY ─────────────────────────── */}
      <div className="rp-body">

        {activeTab === 'overview' && (
          <>
            <div className="rp-feature-callout" role="region" aria-label="Co-authorship map">
              <div className="rp-feature-callout__badge">Real collaborations</div>
              <div className="rp-feature-callout__body">
                <h3 className="rp-feature-callout__title">Who published with this researcher?</h3>
                <p className="rp-feature-callout__text">
                  The <strong>Co-authors</strong> tab builds a network from <strong>shared papers</strong> in the
                  DZresearch catalog (same paper, two authors). That is different from the site-wide{' '}
                  <strong>Similarity map</strong> in the menu, which uses AI to show who looks <em>similar</em> on
                  profiles—not who wrote together.
                </p>
                <button
                  type="button"
                  className="rp-feature-callout__btn"
                  onClick={() => setActiveTab('collaboration')}
                >
                  Open co-author map →
                </button>
              </div>
            </div>

            {/* Bio / Specialty */}
            {(data.bio || data.specialty || data.website || data.orcid) && (
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
                ? (
                  <p style={{ color: '#94a3b8' }}>
                    No AI similarity list for this record (they may be in the database but not in the embedding
                    index). The rest of the profile still loads. Use the menu <strong>Similarity map</strong> to explore
                    the catalog or compare two IDs there.
                  </p>
                  )
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

        {activeTab === 'collaboration' && (
          <div className="rp-section rp-collab">
            <div className="rp-collab__header">
              <h2>Co-authorship map</h2>
              <p className="rp-collab__tagline">Based on papers we have in common — not AI “look-alikes”</p>
            </div>
            <p className="rp-collab__intro">
              Each link is another researcher who appears on <strong>at least one</strong> of the same papers as this
              profile. Thicker lines mean more shared publications. Click a node to open their profile.
            </p>
            {collabLoading && (
              <p style={{ color: '#64748b' }}>Loading collaboration data…</p>
            )}
            {!collabLoading && collabError && (
              <p className="rp-collab__error">{collabError}</p>
            )}
            {!collabLoading && !collabError && collabNodes.length <= 1 && (
              <div className="rp-collab__empty">
                <p><strong>No shared-paper links in this catalog yet.</strong></p>
                <p>
                  We only draw edges when another author appears on the same paper record in our database. If this
                  researcher has co-authors in real life but they do not appear here, we may not have imported those
                  papers or links yet.
                </p>
              </div>
            )}
            {!collabLoading && !collabError && collabNodes.length > 1 && (
              <div className="rp-collab__graph">
                <NetworkGraph
                  researcherId={decodedId}
                  nodes={collabNodes}
                  edges={collabEdges}
                  height={420}
                  graphTitle="Shared-paper network"
                  onNodeClick={nid => navigate(`/researcher/${encodeURIComponent(nid)}`)}
                />
              </div>
            )}
          </div>
        )}

      </div>

      {editOpen && (
        <div className="rp-modal-backdrop" role="presentation" onClick={() => !editSaving && setEditOpen(false)}>
          <div className="rp-modal" role="dialog" aria-labelledby="rp-edit-title" onClick={e => e.stopPropagation()}>
            <h2 id="rp-edit-title">Edit your profile</h2>
            <p className="rp-modal__hint">Only the fields below can be changed; bibliometric data stays synced from the catalog.</p>
            {editError && <p className="rp-modal__error">{editError}</p>}
            <form onSubmit={saveProfile}>
              <label className="rp-modal__field">
                <span>Specialty</span>
                <input
                  value={editForm.specialty}
                  onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                  maxLength={300}
                />
              </label>
              <label className="rp-modal__field">
                <span>Bio</span>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  rows={5}
                  maxLength={2000}
                />
              </label>
              <label className="rp-modal__field">
                <span>Website</span>
                <input
                  value={editForm.website}
                  onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://…"
                  maxLength={500}
                />
              </label>
              <label className="rp-modal__field">
                <span>ORCID</span>
                <input
                  value={editForm.orcid}
                  onChange={e => setEditForm(f => ({ ...f, orcid: e.target.value }))}
                  placeholder="0000-0002-1825-0097 or full URL"
                  maxLength={80}
                />
              </label>
              <div className="rp-modal__actions">
                <button type="button" className="rp-modal__btn rp-modal__btn--ghost" disabled={editSaving} onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="rp-modal__btn rp-modal__btn--primary" disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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