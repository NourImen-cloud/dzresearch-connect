/**
 * NetworkGraph
 * ─────────────────────────────────────────────────────────────
 * Displays the co-authorship ego network for one researcher.
 *
 * Props:
 *   researcherId   string   — ID of the central researcher (required)
 *   nodes          array    — all researcher nodes  [{ id, name, location, papers }]
 *   edges          array    — all coauthor edges    [{ source, target, weight }]
 *   height         number   — canvas height in px   (default 380)
 *   onNodeClick    fn(id)   — called when a neighbor node is clicked
 *
 * Usage (inside Profile page):
 *   import NetworkGraph from '../components/NetworkGraph'
 *   import { GRAPH_NODES, GRAPH_EDGES } from '../data/mockData'
 *
 *   <NetworkGraph
 *     researcherId={researcher.id}
 *     nodes={GRAPH_NODES}
 *     edges={GRAPH_EDGES}
 *     onNodeClick={(id) => navigate(`/researcher/${id}`)}
 *   />
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useNavigate } from 'react-router-dom'
import './Networkgraph.css'

/* ── Color helpers ───────────────────────────────────────── */
const COLOR_CENTER   = '#f5a623'   // gold  — the ego node
const COLOR_ALGERIA  = '#1D9E75'   // teal  — local researchers
const COLOR_ABROAD   = '#7F77DD'   // purple— diaspora researchers
const COLOR_EDGE     = '#94a3b8'   // gray  — connection lines

function nodeColor(node, centerId) {
  if (node.id === centerId) return COLOR_CENTER
  return node.location === 'Algeria' ? COLOR_ALGERIA : COLOR_ABROAD
}

function nodeRadius(node, centerId) {
  if (node.id === centerId) return 28
  // size proportional to paper count, clamped between 14 and 22
  return Math.max(14, Math.min(22, 10 + (node.papers || 0) / 12))
}

/* ═══════════════════════════════════════════════════════════ */
export default function NetworkGraph({
  researcherId,
  nodes = [],
  edges = [],
  height = 380,
  onNodeClick,
}) {
  const svgRef     = useRef(null)
  const navigate   = useNavigate()
  const [tooltip, setTooltip] = useState(null)  // { x, y, node }
  const [hoveredId, setHoveredId] = useState(null)

  // ── Build ego subgraph ──────────────────────────────────
  // Only keep nodes connected to the center researcher
  const neighborIds = new Set([researcherId])
  edges.forEach(e => {
    if (e.source === researcherId || e.target === researcherId) {
      neighborIds.add(e.source)
      neighborIds.add(e.target)
    }
  })

  const subNodes = nodes.filter(n => neighborIds.has(n.id))
  const subEdges = edges.filter(e =>
    neighborIds.has(e.source) && neighborIds.has(e.target)
  )

  // ── D3 simulation ───────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || subNodes.length === 0) return

    const svg    = d3.select(svgRef.current)
    const width  = svgRef.current.clientWidth || 600

    svg.selectAll('*').remove()   // clear on re-render

    // Deep-copy nodes & edges so D3 can mutate them freely
    const simNodes = subNodes.map(n => ({ ...n }))
    const simEdges = subEdges.map(e => ({ ...e }))

    // Container group (enables zoom/pan)
    const g = svg.append('g')

    // Zoom behaviour
    const zoom = d3.zoom()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)

    // Force simulation
    const simulation = d3.forceSimulation(simNodes)
      .force('link',   d3.forceLink(simEdges).id(d => d.id).distance(d => 120 - d.weight * 8))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => nodeRadius(d, researcherId) + 12))

    // ── Edges ─────────────────────────────────────────────
    const link = g.append('g')
      .attr('class', 'ng-edges')
      .selectAll('line')
      .data(simEdges)
      .join('line')
        .attr('stroke', COLOR_EDGE)
        .attr('stroke-opacity', 0.45)
        .attr('stroke-width', d => Math.max(1, d.weight * 0.8))

    // ── Nodes ─────────────────────────────────────────────
    const node = g.append('g')
      .attr('class', 'ng-nodes')
      .selectAll('g')
      .data(simNodes)
      .join('g')
        .attr('class', 'ng-node')
        .style('cursor', d => d.id !== researcherId ? 'pointer' : 'default')
        .call(
          d3.drag()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart()
              d.fx = d.x; d.fy = d.y
            })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
            .on('end',  (event, d) => {
              if (!event.active) simulation.alphaTarget(0)
              d.fx = null; d.fy = null
            })
        )

    // Outer glow ring on center node
    node.filter(d => d.id === researcherId)
      .append('circle')
        .attr('r', d => nodeRadius(d, researcherId) + 8)
        .attr('fill', 'none')
        .attr('stroke', COLOR_CENTER)
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 3')

    // Main circle
    node.append('circle')
      .attr('r',    d => nodeRadius(d, researcherId))
      .attr('fill', d => nodeColor(d, researcherId))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.9)

    // Initials label
    node.append('text')
      .text(d => d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#fff')
      .attr('font-size', d => d.id === researcherId ? '11px' : '9px')
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif')
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    // Name label below node
    node.append('text')
      .text(d => {
        const parts = d.name.replace(/^(Dr\.|Prof\.)\s*/i, '').split(' ')
        return parts[parts.length - 1]   // just last name to keep it compact
      })
      .attr('text-anchor', 'middle')
      .attr('dy', d => nodeRadius(d, researcherId) + 14)
      .attr('fill', '#334155')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    // ── Hover & click interactions ─────────────────────────
    node
      .on('mouseenter', (event, d) => {
        setHoveredId(d.id)
        const rect = svgRef.current.getBoundingClientRect()
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 12,
          node: d,
        })
        // Highlight connected edges
        link
          .attr('stroke-opacity', l =>
            l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.1
          )
          .attr('stroke', l =>
            l.source.id === d.id || l.target.id === d.id ? nodeColor(d, researcherId) : COLOR_EDGE
          )
      })
      .on('mousemove', (event) => {
        const rect = svgRef.current.getBoundingClientRect()
        setTooltip(prev => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top - 12 } : null)
      })
      .on('mouseleave', () => {
        setHoveredId(null)
        setTooltip(null)
        link
          .attr('stroke-opacity', 0.45)
          .attr('stroke', COLOR_EDGE)
      })
      .on('click', (event, d) => {
        if (d.id === researcherId) return
        if (onNodeClick) onNodeClick(d.id)
        else navigate(`/researcher/${d.id}`)
      })

    // ── Tick ──────────────────────────────────────────────
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Run a few ticks immediately so graph doesn't appear from center
    simulation.tick(80)
    simulation.on('tick')()   // apply positions
    simulation.alpha(0.3).restart()

    return () => simulation.stop()
  }, [researcherId, subNodes.length, subEdges.length, height])

  const centerNode = subNodes.find(n => n.id === researcherId)
  const neighborCount = subNodes.length - 1

  return (
    <div className="ng">

      {/* ── Header ─────────────────────────────── */}
      <div className="ng__header">
        <div className="ng__header-left">
          <h3 className="ng__title">Collaboration Network</h3>
          <p className="ng__subtitle">
            {neighborCount > 0
              ? `${neighborCount} direct co-author${neighborCount !== 1 ? 's' : ''}`
              : 'No co-authors found'
            }
          </p>
        </div>
        <div className="ng__legend">
          <span className="ng__legend-item">
            <span className="ng__dot" style={{ background: COLOR_CENTER }} />
            This researcher
          </span>
          <span className="ng__legend-item">
            <span className="ng__dot" style={{ background: COLOR_ALGERIA }} />
            Algeria
          </span>
          <span className="ng__legend-item">
            <span className="ng__dot" style={{ background: COLOR_ABROAD }} />
            Abroad
          </span>
        </div>
      </div>

      {/* ── Canvas ─────────────────────────────── */}
      <div className="ng__canvas-wrap" style={{ height }}>
        {subNodes.length === 0 ? (
          <div className="ng__empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.3">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8M12 8v8"/>
            </svg>
            <p>No network data available</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="ng__svg"
            width="100%"
            height={height}
          />
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="ng__tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="ng__tooltip-name">{tooltip.node.name}</p>
            <p className="ng__tooltip-inst">{tooltip.node.institution || 'Unknown institution'}</p>
            <div className="ng__tooltip-meta">
              <span>{tooltip.node.papers} papers</span>
              <span className={`ng__tooltip-loc ng__tooltip-loc--${tooltip.node.location === 'Algeria' ? 'local' : 'abroad'}`}>
                {tooltip.node.location}
              </span>
            </div>
            {tooltip.node.id !== researcherId && (
              <p className="ng__tooltip-hint">Click to view profile</p>
            )}
          </div>
        )}
      </div>

      {/* ── Neighbor list ──────────────────────── */}
      {subNodes.filter(n => n.id !== researcherId).length > 0 && (
        <div className="ng__neighbors">
          <p className="ng__neighbors-label">Co-authors</p>
          <div className="ng__neighbors-list">
            {subNodes
              .filter(n => n.id !== researcherId)
              .map(n => {
                const edge = subEdges.find(e =>
                  (e.source === n.id || e.source?.id === n.id) &&
                  (e.target === researcherId || e.target?.id === researcherId) ||
                  (e.target === n.id || e.target?.id === n.id) &&
                  (e.source === researcherId || e.source?.id === researcherId)
                )
                return (
                  <button
                    key={n.id}
                    className={`ng__neighbor ${hoveredId === n.id ? 'ng__neighbor--hovered' : ''}`}
                    onClick={() => onNodeClick ? onNodeClick(n.id) : navigate(`/researcher/${n.id}`)}
                  >
                    <span
                      className="ng__neighbor-dot"
                      style={{ background: nodeColor(n, researcherId) }}
                    />
                    <span className="ng__neighbor-name">{n.name}</span>
                    {edge && (
                      <span className="ng__neighbor-weight">
                        {edge.weight} shared paper{edge.weight !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}