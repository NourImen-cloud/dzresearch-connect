import { useParams, useNavigate } from 'react-router-dom'
import { MOCK_RESULTS } from '../data/mockData'
import './PaperProfile.css'

export default function PaperProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const found = MOCK_RESULTS.find(r => r.id === id && r.type === 'paper')

  const data = found || {
    id,
    title: 'Deep Learning Approaches for Arabic Natural Language Processing',
    authors: 'Dr. Karim Benali, Dr. Sarah Mansouri, Dr. Amina Boudjemaa',
    topics: ['Deep Learning', 'Natural Language Processing', 'Arabic Language', 'Transformers', 'Machine Learning'],
    year: 2023,
    source: 'arXiv',
    citations: 156,
    abstract: 'This paper presents novel deep learning architectures specifically designed for processing Arabic text. We introduce attention mechanisms tailored to handle the morphological complexity of Arabic, demonstrating significant improvements over existing approaches. Our proposed model achieves state-of-the-art results on multiple Arabic NLP benchmarks, including named entity recognition, sentiment analysis, and machine translation. The architecture incorporates bidirectional transformers with custom tokenization strategies that account for the unique characteristics of Arabic script and grammar. We also explore transfer learning techniques to leverage pre-trained models while fine-tuning for Arabic-specific tasks. Experimental results on standard datasets show improvements of up to 15% over baseline models, with particularly strong performance on dialectal Arabic variants common in North African regions.',
  }

  const authorList = data.authors.replace(/^By /, '').split(',').map(a => a.trim())

  const similarPapers = MOCK_RESULTS.filter(r => r.type === 'paper' && r.id !== id).map(p => ({
    ...p,
    authors: p.authors.replace(/^By /, ''),
  }))

  return (
    <div className="pp">

      {/* ── HERO ─────────────────────────── */}
      <div className="pp-hero">
        <div className="pp-hero__dots" />
<div className="pp-hero__inner">
  <div className="pp-hero__row">
    <div className="pp-hero__left">
      <div className="pp-hero__icon"><PaperBigIcon /></div>
      <button className="pp-back" onClick={() => navigate(-1)}>
        <ArrowLeftIcon /> Back
      </button>
    </div>
    <div className="pp-hero__right">
      <h1 className="pp-hero__title">{data.title}</h1>
      <div className="pp-hero__meta">
        {data.year   && <span><CalendarIcon /> {data.year}</span>}
        {data.source && <span><BookIcon /> {data.source}</span>}
        <span><CitationIcon /> {data.citations} citations</span>
      </div>
      <div className="pp-hero__topics">
        {data.topics.map(t => <span key={t} className="pp-tag">{t}</span>)}
      </div>
    </div>
  </div>
</div>
      </div>

      {/* ── BODY ─────────────────────────── */}
      <div className="pp-body">

        {/* Authors */}
        <div className="pp-section">
          <h2 className="pp-section__title"><PersonIcon /> Authors</h2>
          <div className="pp-authors">
            {authorList.map(a => (
              <span key={a} className="pp-author-chip">{a}</span>
            ))}
          </div>
        </div>

        {/* Abstract */}
        <div className="pp-section">
          <h2 className="pp-section__title">Abstract</h2>
          <div className="pp-abstract">
            <p>{data.abstract || 'No abstract available.'}</p>
          </div>
        </div>

        {/* Publication Details */}
        <div className="pp-section">
          <h2 className="pp-section__title">Publication Details</h2>
          <div className="pp-details">
            <div className="pp-detail">
              <span className="pp-detail__icon"><CalendarIcon /></span>
              <p className="pp-detail__label">Year</p>
              <p className="pp-detail__value">{data.year || '—'}</p>
            </div>
            <div className="pp-detail">
              <span className="pp-detail__icon"><BookIcon /></span>
              <p className="pp-detail__label">Source</p>
              <p className="pp-detail__value">{data.source || '—'}</p>
            </div>
            <div className="pp-detail">
              <span className="pp-detail__icon"><CitationIcon /></span>
              <p className="pp-detail__label">Citations</p>
              <p className="pp-detail__value">{data.citations}</p>
            </div>
          </div>
        </div>

        {/* Similar Papers */}
        {similarPapers.length > 0 && (
          <div className="pp-section">
            <h2 className="pp-section__title">Similar Papers</h2>
            <div className="pp-similar">
              {similarPapers.map(p => (
                <div key={p.id} className="pp-similar__card" onClick={() => navigate(`/paper/${p.id}`)}>
                  <div className="pp-similar__header">
                    <h3 className="pp-similar__title">{p.title}</h3>
                    <button className="pp-similar__ext" aria-label="Open"><ExtLinkIcon /></button>
                  </div>
                  <p className="pp-similar__authors">{p.authors}</p>
                  <div className="pp-similar__footer">
                    {p.year && <span className="pp-year-badge">{p.year}</span>}
                    <span><CitationIcon /> {p.citations} citations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────── */
function ArrowLeftIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
}
function PaperBigIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function CalendarIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function BookIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
}
function CitationIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function PersonIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function ExtLinkIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
}