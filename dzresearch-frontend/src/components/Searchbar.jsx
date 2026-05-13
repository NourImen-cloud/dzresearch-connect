/**
 * SearchBar — reusable component used on Home and Search pages.
 *
 * Props:
 *   initialQuery  string   — prefills the input (e.g. from URL ?q=)
 *   onSearch      fn(filters) — called when user submits
 *                              receives { query, country, type, topic }
 *   variant       'hero' | 'page'
 *                 'hero'  → white input on dark background  (Home page)
 *                 'page'  → same style but can differ if needed (Search page)
 *   autoFocus     bool    — whether input gets focus on mount
 */

import { useState, useRef, useEffect } from 'react'
import { COUNTRIES, TYPES, TOPICS } from '../data/mockData'
import './Searchbar.css'

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="sb-filter-group">
      <p className="sb-filter-group__label">{label}</p>
      {options.map(o => (
        <div
          key={o}
          className={`sb-filter-option ${value === o ? 'active' : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
        </div>
      ))}
    </div>
  )
}

export default function SearchBar({
  initialQuery = '',
  onSearch,
  variant = 'hero',
  autoFocus = false,
}) {
  const [inputVal,    setInputVal]    = useState(initialQuery)
  const [country,     setCountry]     = useState('All Countries')
  const [type,        setType]        = useState('All')
  const [topic,       setTopic]       = useState('All Topics')
  const [showFilter,  setShowFilter]  = useState(false)
  const filterRef = useRef(null)

  // Sync if parent changes initialQuery (e.g. URL navigation)
  useEffect(() => { setInputVal(initialQuery) }, [initialQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilter(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeCount = [
    country !== 'All Countries',
    type    !== 'All',
    topic   !== 'All Topics',
  ].filter(Boolean).length

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowFilter(false)
    onSearch?.({ query: inputVal.trim(), country, type, topic })
  }

  const clearAll = () => {
    setCountry('All Countries')
    setType('All')
    setTopic('All Topics')
  }

  return (
    <form className={`sb sb--${variant}`} onSubmit={handleSubmit}>

      {/* Text input */}
      <div className="sb__input-wrap">
        <svg className="sb__search-icon" width="18" height="18" viewBox="0 0 22 22" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
          <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          className="sb__input"
          placeholder="Search researchers, papers, topics..."
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          autoFocus={autoFocus}
        />
        {inputVal && (
          <button
            type="button"
            className="sb__clear"
            onClick={() => setInputVal('')}
            aria-label="Clear"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Filter button + dropdown */}
      <div className="sb__filter-wrap" ref={filterRef}>
        <button
          type="button"
          className={`sb__filter-btn ${showFilter ? 'open' : ''}`}
          onClick={() => setShowFilter(v => !v)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters
          {activeCount > 0 && <span className="sb__badge">{activeCount}</span>}
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={{ transform: showFilter ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showFilter && (
          <div className="sb__dropdown">
            <FilterGroup label="Country" options={COUNTRIES} value={country} onChange={setCountry} />
            <FilterGroup label="Type"    options={TYPES}     value={type}    onChange={setType}    />
            <FilterGroup label="Topic"   options={TOPICS}    value={topic}   onChange={setTopic}   />
            {activeCount > 0 && (
              <div className="sb__dropdown-footer">
                <button type="button" onClick={clearAll}>Clear all filters</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <button type="submit" className="sb__submit">Search</button>
    </form>
  )
}