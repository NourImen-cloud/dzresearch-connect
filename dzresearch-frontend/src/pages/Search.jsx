import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SearchBar from '../components/Searchbar'
import { searchAll, listSavedSearches, createSavedSearch, deleteSavedSearch } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Search.css'

const SORT_OPTIONS = ['Relevance', 'Most Recent', 'Most Citations']

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const { token, isAuthenticated } = useAuth()

  const [filters,  setFilters]  = useState({
    query:   initialQuery,
    country: 'All Countries',
    type:    'All',
    topic:   'All Topics',
  })
  const [sortBy,   setSortBy]   = useState('Relevance')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [visibleN, setVisibleN] = useState(6)
  const [savedList, setSavedList] = useState([])
  const [saveName, setSaveName] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const loadSaved = useCallback(() => {
    if (!token) {
      setSavedList([])
      return
    }
    listSavedSearches(token)
      .then(setSavedList)
      .catch(() => setSavedList([]))
  }, [token])

  useEffect(() => {
    loadSaved()
  }, [loadSaved])
  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data = await searchAll(filters.query, {
        location: filters.country,
        type:     filters.type,
        topic:    filters.topic,
      }, 50)

      // Client-side sort
      if (sortBy === 'Most Recent')
        data = [...data].sort((a, b) => (b.year || 0) - (a.year || 0))
      if (sortBy === 'Most Citations')
        data = [...data].sort((a, b) =>
          (b.citations || b.papers || 0) - (a.citations || a.papers || 0)
        )

      setResults(data)
      setVisibleN(6)
    } catch (err) {
      setError('Could not reach the server. Is the backend running?')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy])

  useEffect(() => {
    const timer = setTimeout(fetchResults, 350)
    return () => clearTimeout(timer)
  }, [fetchResults])

  // Keep URL in sync with query
  const handleSearch = ({ query, country, type, topic }) => {
    setFilters({ query, country, type, topic })
    if (query) setSearchParams({ q: query })
    else setSearchParams({})
  }

  const removeFilter = (key, resetValue) => {
    setFilters(prev => ({ ...prev, [key]: resetValue }))
  }

  function applySavedSearch(s) {
    setFilters({
      query: s.query || '',
      country: s.country || 'All Countries',
      type: s.result_type || 'All',
      topic: s.topic || 'All Topics',
    })
    if (s.query) setSearchParams({ q: s.query })
    else setSearchParams({})
  }

  async function handleSaveSearch(e) {
    e.preventDefault()
    if (!token || !saveName.trim()) return
    setSaveMsg('')
    try {
      await createSavedSearch(token, {
        name: saveName.trim(),
        query: filters.query || '',
        country: filters.country,
        result_type: filters.type,
        topic: filters.topic,
      })
      setSaveName('')
      setSaveMsg('Saved.')
      loadSaved()
    } catch (ex) {
      setSaveMsg(ex.message || 'Could not save')
    }
  }

  async function handleDeleteSaved(id) {
    if (!token) return
    try {
      await deleteSavedSearch(token, id)
      loadSaved()
    } catch { /* ignore */ }
  }

  const activeChips = [
    filters.country !== 'All Countries' && { label: filters.country, key: 'country', reset: 'All Countries' },
    filters.type    !== 'All'           && { label: filters.type,    key: 'type',    reset: 'All'           },
    filters.topic   !== 'All Topics'    && { label: filters.topic,   key: 'topic',   reset: 'All Topics'    },
  ].filter(Boolean)

  const isDefaultView = !filters.query && activeChips.length === 0

  return (
    <div className="sp">

      {/* ── HERO HEADER ─────────────────────────── */}
      <div className="sp-hero">
        <div className="sp-hero__dots" />
        <div className="sp-hero__inner">
          <h1 className="sp-hero__title">Search Results</h1>
          <p className="sp-hero__sub">
            Discover researchers and papers across Algeria's research community
          </p>
          <SearchBar
            initialQuery={initialQuery}
            onSearch={handleSearch}
            variant="hero"
            autoFocus
          />
        </div>
      </div>

      {/* ── RESULTS BODY ─────────────────────────── */}
      <div className="sp-body">
        <div className={`sp-layout ${isAuthenticated && token ? 'sp-layout--with-saved' : ''}`}>
          {isAuthenticated && token && (
            <aside className="sp-saved" aria-label="Saved searches">
              <h2 className="sp-saved__title">Saved searches</h2>
              <p className="sp-saved__hint">
                Save the current filters under a name, then click a name to restore them. (Different from{' '}
                <strong>Email digest</strong> in the menu — that emails catalog matches weekly.)
              </p>
              <form className="sp-saved__form" onSubmit={handleSaveSearch}>
                <input
                  className="sp-saved__input"
                  placeholder="Name (e.g. ML Algeria)"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                />
                <button type="submit" className="sp-saved__save" disabled={!saveName.trim()}>
                  Save current search
                </button>
              </form>
              {saveMsg && <p className="sp-saved__msg">{saveMsg}</p>}
              <ul className="sp-saved__list">
                {savedList.length === 0 && (
                  <li className="sp-saved__empty">No saved searches yet.</li>
                )}
                {savedList.map(s => (
                  <li key={s.id} className="sp-saved__item">
                    <button type="button" className="sp-saved__apply" onClick={() => applySavedSearch(s)}>
                      {s.name}
                    </button>
                    <button
                      type="button"
                      className="sp-saved__del"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => handleDeleteSaved(s.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className="sp-main">
        {activeChips.length > 0 && (
          <div className="sp-chips">
            {activeChips.map(c => (
              <Chip key={c.key} label={c.label} onRemove={() => removeFilter(c.key, c.reset)} />
            ))}
          </div>
        )}

        {/* Meta row — always show when we have results */}
        {!loading && (
          <div className="sp-meta">
            <p className="sp-meta__count">
              {isDefaultView
                ? <>Showing <span>{results.length}</span> researchers and papers</>
                : <>Found <span>{results.length}</span> results
                    {filters.query && <em> for "{filters.query}"</em>}
                  </>
              }
            </p>
            <div className="sp-meta__sort">
              <span>Sort by:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="sp-grid">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error banner */}
        {!loading && error && (
          <div className="sp-empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.3">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>Backend not reachable</h3>
            <p>{error}</p>
          </div>
        )}

        {/* No results after filtering */}
        {!loading && results.length === 0 && (
          <div className="sp-empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.3">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11" strokeLinecap="round"/>
            </svg>
            <h3>No results found</h3>
            <p>Try different keywords or remove some filters</p>
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <>
            {isDefaultView && (
              <p className="sp-section-label">All researchers and papers</p>
            )}
            <div className="sp-grid">
              {results.slice(0, visibleN).map(r =>
                r.type === 'researcher'
                  ? <ResearcherCard key={r.id} data={r} />
                  : <PaperCard      key={r.id} data={r} />
              )}
            </div>

            {visibleN < results.length && (
              <div className="sp-load-more">
                <button onClick={() => setVisibleN(v => v + 6)}>
                  Load More Results
                </button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

function profilePath(researcherId) {
  return `/researcher/${encodeURIComponent(researcherId)}`
}

function paperPath(paperId) {
  return `/paper/${encodeURIComponent(paperId)}`
}

/* ── Researcher card ─────────────────────────────────────── */
function ResearcherCard({ data }) {
  const navigate = useNavigate()
  const to = profilePath(data.id)
  return (
    <article
      className="rc"
      role="link"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(to)
        }
      }}
      aria-label={`Open full profile for ${data.name}`}
    >
      <div className="rc__img-wrap">
        {data.image
          ? <img src={data.image} alt="" className="rc__img" loading="lazy" />
          : <div className="rc__img-placeholder"><PersonIcon /></div>
        }
        {data.score != null && <span className="rc__score">{data.score}%</span>}
      </div>
      <div className="rc__body">
        <p className="rc__preview-label">Search preview — not the full profile</p>
        <h3 className="rc__name">{data.name}</h3>
        <p className="rc__inst"><LocationIcon /> {data.institution}</p>
        <div className="rc__topics">
          {data.topics.map(t => <span key={t} className="tc">{t}</span>)}
        </div>
      </div>
      <div className="rc__footer">
        <span><PaperSmIcon /> {data.papers} papers</span>
        <span><LocationIcon /> {data.location}</span>
      </div>
      <div className="rc__cta">
        <span className="rc__cta-text">Open full profile</span>
        <span className="rc__cta-hint">Publications, co-authors, similar researchers</span>
      </div>
    </article>
  )
}

/* ── Paper card ──────────────────────────────────────────── */
function PaperCard({ data }) {
  const navigate = useNavigate()
  const to = paperPath(data.id)
  return (
    <article
      className="pc"
      role="link"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(to)
        }
      }}
      aria-label={`Open paper ${data.title}`}
    >
      <div className="pc__img-wrap">
        <PaperBigIcon />
        {data.score != null && <span className="rc__score">{data.score}%</span>}
      </div>
      <div className="rc__body">
        <h3 className="pc__title">{data.title}</h3>
        <p className="pc__authors">{data.authors}</p>
        <div className="rc__topics">
          {data.topics.map(t => <span key={t} className="tc">{t}</span>)}
          {data.year && <span className="yc">{data.year}</span>}
        </div>
      </div>
      <div className="rc__footer">
        <span><CitationIcon /> {data.citations} citations</span>
        <span className="pc__type"><PaperSmIcon /> Paper</span>
      </div>
      <div className="rc__cta rc__cta--paper">
        <span className="rc__cta-text">Open paper</span>
      </div>
    </article>
  )
}

/* ── Chip ────────────────────────────────────────────────── */
function Chip({ label, onRemove }) {
  return (
    <span className="sp-chip">
      {label}
      <button onClick={onRemove} aria-label="Remove filter">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </span>
  )
}

/* ── Skeleton card ───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="sk">
      <div className="sk__img" />
      <div className="sk__body">
        <div className="sk__line sk__line--title" />
        <div className="sk__line sk__line--sub" />
        <div className="sk__line sk__line--tags" />
      </div>
      <div className="sk__footer">
        <div className="sk__line sk__line--meta" />
        <div className="sk__line sk__line--meta" />
      </div>
    </div>
  )
}

/* ── Icons ───────────────────────────────────────────────── */
function PersonIcon() {
  return <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function LocationIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function PaperSmIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
function CitationIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function PaperBigIcon() {
  return <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}