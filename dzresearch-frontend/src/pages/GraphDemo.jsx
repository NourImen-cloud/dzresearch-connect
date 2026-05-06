import NetworkGraph from '../components/Networkgrapgh'
import { GRAPH_NODES, GRAPH_EDGES } from '../data/mockData'

export default function GraphDemo() {
  return (
    <div style={{ maxWidth: 700, margin: '100px auto', padding: '0 2rem' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '1.5rem', color: '#0f1729' }}>
        Network Graph — Preview
      </h2>
      <NetworkGraph
        researcherId="1"
        nodes={GRAPH_NODES}
        edges={GRAPH_EDGES}
        onNodeClick={(id) => alert(`Navigate to researcher ${id}`)}
      />
    </div>
  )
}