import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './ResearcherProfile.css'

export default function ResearcherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const data = {
    id,
    name: 'Dr. Amina Boudjemaa',
    institution: 'University of Algiers',
    location: 'Algiers, Algeria',
    email: 'a.boudjemaa@univ-algiers.dz',
    image: null,
    topics: ['Artificial Intelligence', 'Machine Learning', 'Natural Language Processing', 'Computer Vision'],
    hIndex: 24,
    citations: 1842,
    publications: 42,
    totalPapers: 42,
    papers: [
      {
        id: 'p1',
        title: 'Deep Learning Approaches for Arabic Natural Language Processing',
        topics: ['Deep Learning', 'NLP', 'Arabic Language', 'Transformers'],
        abstract: 'This paper presents novel deep learning architectures specifically designed for processing Arabic text. We introduce attention mechanisms tailored to handle the morphological complexity of Arabic.',
        year: 2024,
        citations: 156,
      },
      {
        id: 'p2',
        title: 'Transfer Learning for Low-Resource Languages',
        topics: ['Transfer Learning', 'Machine Learning', 'NLP'],
        abstract: 'A study on applying transfer learning techniques to improve NLP performance for low-resource languages including Algerian Arabic dialects.',
        year: 2023,
        citations: 98,
      },
      {
        id: 'p3',
        title: 'Neural Machine Translation Systems for Algerian Arabic Dialects',
        topics: ['Machine Translation', 'Neural Networks', 'Arabic Dialects'],
        abstract: 'A comprehensive study on building neural machine translation systems specifically for Algerian Arabic dialects, addressing unique linguistic challenges.',
        year: 2023,
        citations: 124,
      },
    ],
  }

  const similarResearchers = [
    { id: 's1', name: 'Dr. Karim Benali',    institution: 'University of Constantine', topics: ['Artificial Intelligence', 'Deep Learning', 'Computer Vision'] },
    { id: 's2', name: 'Prof. Sarah Mansouri', institution: 'University of Oran',        topics: ['Natural Language Processing', 'Machine Learning'] },
    { id: 's3', name: 'Dr. Leila Hamdi',      institution: 'University of Annaba',      topics: ['Artificial Intelligence', 'Neural Networks'] },
    { id: 's4', name: 'Prof. Yacine Rezki',   institution: 'University of Tiemcen',    topics: ['Machine Learning', 'Data Science'] },
  ]

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
                  {data.image
                    ? <img src={data.image} alt={data.name} />
                    : <PersonIcon size={54} />
                  }
                </div>
                <div className="rp-hero__details">
                  <h1 className="rp-hero__name">{data.name}</h1>
                  <div className="rp-hero__meta">
                    <span><LocationIcon /> {data.institution}</span>
                    <span><LocationIcon /> {data.location}</span>
                    {data.email && <span><EmailIcon /> {data.email}</span>}
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
        <StatCard icon={<PaperSmIcon />}  value={data.publications || 0}                  label="Publications" />
        <StatCard icon={<PaperSmIcon />}  value={data.totalPapers || 0}                   label="Total Papers" />
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
        >Publications</button>
      </div>

      {/* ── BODY ─────────────────────────── */}
      <div className="rp-body">

        {activeTab === 'overview' && (
          <>
            <div className="rp-section">
              <div className="rp-section__header">
                <h2>Recent Publications</h2>
                <button className="rp-view-all" onClick={() => setActiveTab('publications')}>
                  View All <ChevronIcon />
                </button>
              </div>
              <div className="rp-papers">
                {data.papers.slice(0, 2).map(p => <PaperRow key={p.id} paper={p} />)}
              </div>
            </div>

            <div className="rp-section">
              <h2>Similar Researchers</h2>
              <div className="rp-similar">
                {similarResearchers.map(r => (
                  <div key={r.id} className="rp-similar__card" onClick={() => navigate(`/researcher/${r.id}`)}>
                    <div className="rp-similar__avatar"><PersonIcon size={28} /></div>
                    <p className="rp-similar__name">{r.name}</p>
                    <p className="rp-similar__inst">{r.institution}</p>
                    <div className="rp-similar__topics">
                      {r.topics.map(t => <span key={t} className="rp-tag rp-tag--sm">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'publications' && (
          <div className="rp-section">
            <h2>All Publications</h2>
            <div className="rp-papers">
              {data.papers.map(p => <PaperRow key={p.id} paper={p} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* ── Paper Row ───────────────────────────────────────────── */
function PaperRow({ paper }) {
  return (
    <div className="rp-paper">
      <div className="rp-paper__header">
        <h3 className="rp-paper__title">{paper.title}</h3>
        <button className="rp-paper__ext" aria-label="Open paper"><ExtLinkIcon /></button>
      </div>
      <div className="rp-paper__tags">
        {paper.topics.map(t => <span key={t} className="rp-tag rp-tag--sm">{t}</span>)}
      </div>
      {paper.abstract && <p className="rp-paper__abstract">{paper.abstract}</p>}
      <div className="rp-paper__footer">
        <span>{paper.year}</span>
        <span className="rp-paper__dot">•</span>
        <span><CitationIcon /> {paper.citations} citations</span>
      </div>
    </div>
  )
}

/* ── Stat Card ───────────────────────────────────────────── */
function StatCard({ icon, value, label }) {
  return (
    <div className="rp-stat">
      <span className="rp-stat__icon">{icon}</span>
      <p className="rp-stat__value">{value}</p>
      <p className="rp-stat__label">{label}</p>
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────── */
function PersonIcon({ size = 38 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function LocationIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function EmailIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
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
function ExtLinkIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
}