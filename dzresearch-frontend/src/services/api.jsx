/**
 * api.jsx — Centralized API client for DzResearch Connect
 * All frontend↔backend communication goes through here.
 *
 * Base URL: http://localhost:8000 (FastAPI backend)
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

function formatApiError(detail) {
  if (detail == null) return 'Request failed'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(e => (typeof e === 'object' && e?.msg ? e.msg : String(e))).join('; ')
  }
  return String(detail)
}

// ── Generic fetch helper ────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const text = await res.text()
  if (!res.ok) {
    let err
    try {
      err = text ? JSON.parse(text) : { detail: res.statusText }
    } catch {
      err = { detail: text || res.statusText }
    }
    throw new Error(formatApiError(err.detail) || `HTTP ${res.status}`)
  }
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ── Normalizers: convert backend snake_case → frontend shape ────

/**
 * Normalize a researcher profile from DB or AI search into
 * a unified shape used by all frontend components.
 */
export function normalizeResearcher(r) {
  const topicsRaw = r.topics || r.topic || ''
  const topics = typeof topicsRaw === 'string'
    ? topicsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : topicsRaw

  return {
    id:          r.id,
    type:        'researcher',
    name:        r.name || 'Unknown',
    institution: r.affiliation || r.institution || 'Unknown',
    location:    r.location || 'Unknown',
    country:     r.country || '',
    topics,
    hIndex:      r.h_index ?? r.hIndex ?? 0,
    citations:   r.citations ?? 0,
    papers:      r.paper_count ?? r.papers ?? 0,
    bio:         r.bio || '',
    specialty:   r.specialty || '',
    website:     r.website || '',
    orcid:       r.orcid || '',
    isClaimed:   r.is_claimed ?? false,
    score:       r.score        // may be undefined for DB results
      ? Math.round(r.score * 100)
      : (r.relevance_score ? Math.round(r.relevance_score * 100) : null),
  }
}

/**
 * Normalize a paper from DB into the unified shape.
 */
export function normalizePaper(p) {
  const conceptsRaw = p.concepts || ''
  const topics = typeof conceptsRaw === 'string'
    ? conceptsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : conceptsRaw

  return {
    id:       p.id,
    type:     'paper',
    title:    p.title || 'Untitled',
    abstract: p.abstract || '',
    year:     p.year || null,
    topics,
    authors:  p.authors || '',
    citations: p.citations ?? 0,
    source:   p.source || 'OpenAlex',
  }
}

// ── Search ──────────────────────────────────────────────────────

/**
 * Semantic AI search — returns mixed researcher + paper results.
 * Falls back to DB name search when query is very short.
 *
 * @param {string} query         - Free-text search query
 * @param {object} filters       - { location, type, topic }
 * @param {number} top_n         - Max results
 */
export async function searchAll(query, filters = {}, top_n = 30) {
  const { location, type, topic } = filters

  // Build location param for AI endpoint
  const locationParam = location && location !== 'All Countries'
    ? location
    : undefined

  // Run researcher and paper searches in parallel
  const [researcherData, paperData] = await Promise.all([
    // AI semantic search for researchers
    query.trim().length >= 2
      ? apiFetch(`/ai/search?query=${encodeURIComponent(query)}&top_n=${top_n}${locationParam ? `&location=${encodeURIComponent(locationParam)}` : ''}`)
          .then(d => d.data?.results || [])
          .catch(() => [])
      : apiFetch(`/profiles?q=${encodeURIComponent(query)}${locationParam ? `&location=${encodeURIComponent(locationParam)}` : ''}`)
          .then(r => r)
          .catch(() => []),

    // DB search for papers by topic/title
    topic && topic !== 'All Topics'
      ? apiFetch(`/papers?topic=${encodeURIComponent(topic)}&limit=20`)
          .then(r => r)
          .catch(() => [])
      : query.trim()
        ? apiFetch(`/papers?topic=${encodeURIComponent(query)}&limit=20`)
            .then(r => r)
            .catch(() => [])
        : Promise.resolve([]),
  ])

  const researchers = researcherData.map(normalizeResearcher)
  const papers      = paperData.map(normalizePaper)

  // Apply type filter
  let results = []
  if (!type || type === 'All') {
    results = [...researchers, ...papers]
  } else if (type === 'Researcher') {
    results = researchers
  } else if (type === 'Paper') {
    results = papers
  }

  // Apply topic filter to researchers (papers already filtered server-side)
  if (topic && topic !== 'All Topics') {
    results = results.filter(r =>
      r.type === 'paper' ||
      r.topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
    )
  }

  return results
}

// ── Researcher ──────────────────────────────────────────────────

/**
 * Fetch a single researcher profile by ID.
 */
export async function getResearcher(id) {
  const data = await apiFetch(`/profiles/by-id/${encodeURIComponent(id)}`)
  return normalizeResearcher(data)
}

/**
 * Fetch papers authored by a researcher.
 */
export async function getResearcherPapers(researcherId) {
  const data = await apiFetch(
    `/researchers/${encodeURIComponent(researcherId)}/papers`
  )
  return data.map(normalizePaper)
}

/**
 * Fetch AI-powered collaborator recommendations for a researcher.
 */
export async function getRecommendations(researcherId, top_n = 6) {
  const data = await apiFetch(
    `/ai/recommendations/${encodeURIComponent(researcherId)}?top_n=${top_n}`
  )
  return (data.data?.results || []).map(normalizeResearcher)
}

// ── Papers ──────────────────────────────────────────────────────

/**
 * Fetch a single paper by ID.
 */
export async function getPaper(paperId) {
  const data = await apiFetch(`/papers/${encodeURIComponent(paperId)}`)
  return normalizePaper(data)
}

/**
 * List papers, optionally filtered by topic.
 */
export async function listPapers(topic = '', limit = 20) {
  const params = new URLSearchParams({ limit })
  if (topic) params.set('topic', topic)
  const data = await apiFetch(`/papers?${params}`)
  return data.map(normalizePaper)
}

// ── Network ─────────────────────────────────────────────────────

/**
 * Fetch network graph nodes and edges from the AI similarity matrix.
 */
export async function getNetworkData(threshold = 0.6) {
  const data = await apiFetch(`/ai/network?threshold=${threshold}`)
  return data.data
}

/**
 * Cosine similarity score between two catalog researchers (embedding space).
 */
export async function getSimilarityPair(idA, idB) {
  const qs = new URLSearchParams()
  qs.set('a', idA)
  qs.set('b', idB)
  const data = await apiFetch(`/ai/similarity-pair?${qs}`)
  return data.data
}

// ── Stats ───────────────────────────────────────────────────────

/**
 * Fetch platform-wide statistics for the Home page.
 */
export async function getStats() {
  return apiFetch('/stats').then(d => d.data)
}

// ── Auth ────────────────────────────────────────────────────────

export function normalizeAuthResponse(d) {
  return {
    accessToken: d.access_token,
    userId: d.user_id,
    email: d.email,
    fullName: d.full_name || '',
    profileListingPending: Boolean(d.profile_listing_pending),
    linkedResearcherId: d.linked_researcher_id || null,
    profileClaimed: Boolean(d.profile_claimed),
  }
}

export async function authLogin(body) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: body.email, password: body.password }),
  })
}

export async function authRegister(body) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getAuthMe(token) {
  return apiFetch('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function patchProfile(researcherId, token, body) {
  return apiFetch(`/profiles/by-id/${encodeURIComponent(researcherId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: authHeaders(token),
  })
}

export async function getCollaborationEgo(researcherId, limitNeighbors = 40) {
  const q = new URLSearchParams({ limit_neighbors: String(limitNeighbors) })
  return apiFetch(
    `/collaboration/ego/${encodeURIComponent(researcherId)}?${q}`
  )
}

export async function listSavedSearches(token) {
  return apiFetch('/saved-searches', { headers: authHeaders(token) })
}

export async function createSavedSearch(token, body) {
  return apiFetch('/saved-searches', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: authHeaders(token),
  })
}

export async function deleteSavedSearch(token, id) {
  return apiFetch(`/saved-searches/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export async function getDigestSubscription(token) {
  return apiFetch('/digests/subscription', { headers: authHeaders(token) })
}

export async function putDigestSubscription(token, body) {
  return apiFetch('/digests/subscription', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: authHeaders(token),
  })
}

export async function getDigestPreview(token) {
  return apiFetch('/digests/preview', { headers: authHeaders(token) })
}

export async function postDigestSendTest(token) {
  return apiFetch('/digests/send-test', {
    method: 'POST',
    headers: authHeaders(token),
  })
}

// ── Chat Assistant ─────────────────────────────────────────────
export async function sendChatMessage(message) {
  return apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
