import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import NetworkGraph from '../components/Networkgrapgh'
import { getNetworkData, getSimilarityPair } from '../services/api'
import './GraphDemo.css'

function mapNetworkPayload(data) {
  const mappedNodes = (data.nodes || []).map(n => ({
    id: String(n.id),
    name: n.label,
    location: n.location || 'Unknown',
    papers: n.paper_count ?? 0,
    topicsLine: String(n.topics || '').toLowerCase(),
  }))
  const mappedEdges = (data.edges || []).map(e => ({
    source: String(e.source),
    target: String(e.target),
    weight: Math.round((e.weight || 0) * 10),
  }))
  return { mappedNodes, mappedEdges }
}

export default function GraphDemo() {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [threshold, setThreshold] = useState(0.6)

  const [topicFilter, setTopicFilter] = useState('')
  const [centerId, setCenterId] = useState('')

  const [pairA, setPairA] = useState('')
  const [pairB, setPairB] = useState('')
  const [pairLoading, setPairLoading] = useState(false)
  const [pairResult, setPairResult] = useState(null)
  const [pairError, setPairError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getNetworkData(threshold)
      .then(data => {
        const { mappedNodes, mappedEdges } = mapNetworkPayload(data)
        setNodes(mappedNodes)
        setEdges(mappedEdges)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [threshold])

  useEffect(() => {
    if (!nodes.length) return
    if (!centerId || !nodes.some(n => n.id === centerId)) {
      setCenterId(nodes[0].id)
    }
  }, [nodes, centerId])

  const { graphNodes, graphEdges, effectiveCenter } = useMemo(() => {
    const q = topicFilter.trim().toLowerCase()
    let n = nodes
    let e = edges
    if (q) {
      n = nodes.filter(
        x => x.name.toLowerCase().includes(q) || (x.topicsLine && x.topicsLine.includes(q))
      )
      const ids = new Set(n.map(x => x.id))
      e = edges.filter(x => ids.has(x.source) && ids.has(x.target))
    }
    const center =
      n.length && n.some(x => x.id === centerId) ? centerId : (n[0]?.id ?? '')
    return { graphNodes: n, graphEdges: e, effectiveCenter: center }
  }, [nodes, edges, topicFilter, centerId])

  async function runPairCompare() {
    setPairError(null)
    setPairResult(null)
    const a = pairA.trim()
    const b = pairB.trim()
    if (!a || !b) {
      setPairError('Paste both researcher IDs (e.g. full OpenAlex URLs from a profile or search).')
      return
    }
    setPairLoading(true)
    try {
      const data = await getSimilarityPair(a, b)
      setPairResult(data)
    } catch (err) {
      setPairError(err.message || 'Could not compare')
    } finally {
      setPairLoading(false)
    }
  }

  return (
    <div className="gd">
      <p className="gd__kicker">AI · whole catalog</p>
      <h2 className="gd__title">Similarity map </h2>
      <p className="gd__lead">
        Each link means two researchers have <strong>similar profiles and publications</strong> in our embedding
        model. This is <em>not</em> the same as co-authoring. For <strong>shared papers</strong>, open a profile and
        use the <strong>Co-authors</strong> tab.
      </p>

      <div className="gd__panel">
        <p className="gd__panel-title">How similarity is computed</p>
        <p className="gd__panel-note">
          The model builds <strong>one vector per researcher</strong> from their catalog text (topics and related
          fields). There is no separate “field” dropdown: everyone is compared in that same space. Use{' '}
          <strong>Topic / name filter</strong> below to limit <em>who appears</em> on the map; use{' '}
          <strong>Compare two</strong> to get a numeric score for any pair in the catalog.
        </p>
      </div>

      <div className="gd__panel">
        <p className="gd__panel-title">Compare two researchers</p>
        <p className="gd__panel-note">
          Paste each person&apos;s <strong>profile ID</strong> (same as OpenAlex URL on their profile URL). Both must
          exist in the AI catalog.
        </p>
        <div className="gd__row">
          <div className="gd__field">
            <label htmlFor="gd-pair-a">Researcher A</label>
            <input
              id="gd-pair-a"
              type="text"
              autoComplete="off"
              placeholder="https://openalex.org/A…"
              value={pairA}
              onChange={e => setPairA(e.target.value)}
            />
          </div>
          <div className="gd__field">
            <label htmlFor="gd-pair-b">Researcher B</label>
            <input
              id="gd-pair-b"
              type="text"
              autoComplete="off"
              placeholder="https://openalex.org/A…"
              value={pairB}
              onChange={e => setPairB(e.target.value)}
            />
          </div>
          <button type="button" className="gd__btn" disabled={pairLoading} onClick={runPairCompare}>
            {pairLoading ? '…' : 'Compare'}
          </button>
        </div>
        {pairError && <p className="gd__pair-err">{pairError}</p>}
        {pairResult && (
          <div className="gd__pair-result">
            <span className="gd__pair-score">
              {typeof pairResult.score === 'number' ? pairResult.score.toFixed(3) : pairResult.score}
            </span>
            <span> similarity (0–1 scale)</span>
            <div style={{ marginTop: '0.35rem', color: '#64748b', fontSize: '0.85rem' }}>
              {pairResult.name_a} ↔ {pairResult.name_b}
              {pairResult.same_profile && ' (same profile)'}
            </div>
          </div>
        )}
      </div>

      <p className="gd__lead" style={{ marginBottom: '0.75rem' }}>
        Map: connections with similarity ≥ {threshold}.
      </p>

      <div className="gd__controls">
        <div className="gd__threshold">
          <label htmlFor="gd-thresh">Threshold</label>
          <input
            id="gd-thresh"
            type="range"
            min="0.5"
            max="0.9"
            step="0.05"
            value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
          />
          <span className="gd__threshold-val">{threshold}</span>
        </div>
        <div className="gd__field" style={{ flex: '1 1 220px', minWidth: '180px' }}>
          <label htmlFor="gd-topic">Topic or name contains</label>
          <input
            id="gd-topic"
            type="search"
            placeholder="e.g. machine learning"
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
          />
        </div>
      </div>

      {graphNodes.length > 0 && (
        <div className="gd__field" style={{ maxWidth: '100%', marginBottom: '1rem' }}>
          <label htmlFor="gd-center">Center graph on</label>
          <select
            id="gd-center"
            value={effectiveCenter}
            onChange={e => setCenterId(e.target.value)}
          >
            {graphNodes.slice(0, 400).map(n => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div className="gd__loading">
          <div className="gd__spin" />
          Loading network data…
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
          <p>⚠️ {error}</p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Run the backend and the AI pipeline so <code>similarity_matrix.npy</code> and{' '}
            <code>embedding_index.csv</code> exist under <code>data/</code>.
          </p>
        </div>
      )}

      {!loading && !error && graphNodes.length > 0 && effectiveCenter && (
        <>
          <p className="gd__meta">
            {graphNodes.length} researchers in this view · {graphEdges.length} edges
            {topicFilter.trim() ? ` · filtered by “${topicFilter.trim()}”` : ''}
          </p>
          <NetworkGraph
            researcherId={effectiveCenter}
            nodes={graphNodes}
            edges={graphEdges}
            graphTitle="Similarity clusters (AI)"
            graphSubtitle={`Cosine similarity ≥ ${threshold}${topicFilter.trim() ? ` · filter: ${topicFilter.trim()}` : ''}`}
            onNodeClick={id => {
              const node = graphNodes.find(n => n.id === id)
              if (node) navigate(`/researcher/${encodeURIComponent(id)}`)
            }}
          />
        </>
      )}

      {!loading && !error && nodes.length > 0 && graphNodes.length === 0 && (
        <p className="gd__empty">
          No researchers match this topic/name filter. Clear the filter or try another keyword.
        </p>
      )}

      {!loading && !error && nodes.length === 0 && (
        <p className="gd__empty">
          No connections at threshold {threshold}. Try lowering the threshold.
        </p>
      )}
    </div>
  )
}
