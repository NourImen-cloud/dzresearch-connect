import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NetworkGraph from '../components/Networkgrapgh'
import { getNetworkData } from '../services/api'

export default function GraphDemo() {
  const navigate  = useNavigate()
  const [nodes,   setNodes]   = useState([])
  const [edges,   setEdges]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [threshold, setThreshold] = useState(0.6)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getNetworkData(threshold)
      .then(data => {
        // Convert backend format → format NetworkGraph component expects
        const mappedNodes = data.nodes.map(n => ({
          id:       String(n.id),
          name:     n.label,
          location: 'Unknown',   // enriched below if needed
          papers:   0,
        }))
        const mappedEdges = data.edges.map(e => ({
          source: String(e.source),
          target: String(e.target),
          weight: Math.round(e.weight * 10), // scale 0–1 → 0–10
        }))
        setNodes(mappedNodes)
        setEdges(mappedEdges)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [threshold])

  return (
    <div style={{ maxWidth: 900, margin: '100px auto', padding: '0 2rem' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '0.5rem', color: '#0f1729' }}>
        Researcher Network Graph
      </h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Showing connections between researchers with similarity ≥ {threshold}
      </p>

      {/* Threshold slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <label style={{ color: '#1e3a5f', fontWeight: 600, fontSize: '0.9rem' }}>
          Threshold:
        </label>
        <input
          type="range" min="0.5" max="0.9" step="0.05"
          value={threshold}
          onChange={e => setThreshold(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ color: '#f5a623', fontWeight: 700, minWidth: 36 }}>{threshold}</span>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #1e3a5f', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          Loading network data…
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
          <p>⚠️ {error}</p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Make sure the backend is running and the AI pipeline has been executed.
          </p>
        </div>
      )}

      {!loading && !error && nodes.length > 0 && (
        <>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {nodes.length} nodes · {edges.length} edges
          </p>
          <NetworkGraph
            researcherId={nodes[0]?.id}
            nodes={nodes}
            edges={edges}
            onNodeClick={id => {
              const node = nodes.find(n => n.id === id)
              if (node) navigate(`/researcher/${encodeURIComponent(id)}`)
            }}
          />
        </>
      )}

      {!loading && !error && nodes.length === 0 && (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '3rem 0' }}>
          No connections found at threshold {threshold}. Try lowering the threshold.
        </p>
      )}
    </div>
  )
}