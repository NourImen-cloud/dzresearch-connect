export const MOCK_RESULTS = [
  {
    id: '1', type: 'researcher',
    name: 'Dr. Amina Boudjemaa',
    institution: 'University of Algiers',
    topics: ['Artificial Intelligence', 'Machine Learning'],
    papers: 84, location: 'Algeria', score: 95,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  },
  {
    id: '2', type: 'paper',
    title: 'Deep Learning Approaches for Arabic Natural Language Processing',
    authors: 'By Dr. Karim Benali, Dr. Sarah Mansouri',
    topics: ['Artificial Intelligence'],
    year: 2023, citations: 142, score: 92,
  },
  {
    id: '3', type: 'researcher',
    name: 'Prof. Mohamed Cherif',
    institution: 'University of Constantine',
    topics: ['Biotechnology', 'Medicine'],
    papers: 120, location: 'Algeria', score: 89,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  },
  {
    id: '4', type: 'researcher',
    name: 'Dr. Leila Hamdi',
    institution: 'University of Annaba',
    topics: ['Computer Science', 'Artificial Intelligence'],
    papers: 51, location: 'Algeria', score: 81,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
  },
  {
    id: '5', type: 'paper',
    title: 'Machine Learning for Medical Diagnosis in Resource-Limited Settings',
    authors: 'By Dr. Amina Boudjemaa, Dr. Karim Benali, Prof. Mohamed Cherif',
    topics: ['Medicine'],
    year: 2024, citations: 67, score: 79,
  },
  {
    id: '6', type: 'researcher',
    name: 'Dr. Karim Benali',
    institution: 'USTHB Algiers',
    topics: ['Machine Learning', 'Computer Vision'],
    papers: 63, location: 'Algeria', score: 76,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  },
  {
    id: '7', type: 'paper',
    title: 'Reinforcement Learning for Autonomous Systems in Constrained Environments',
    authors: 'By Prof. Mohamed Cherif, Dr. Leila Hamdi',
    topics: ['Artificial Intelligence', 'Robotics'],
    year: 2023, citations: 38, score: 74,
  },
  {
    id: '8', type: 'researcher',
    name: 'Prof. Sara Mansouri',
    institution: 'University of Oran',
    topics: ['Natural Language Processing', 'Artificial Intelligence'],
    papers: 97, location: 'Abroad', score: 71,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
  },
]
export const GRAPH_NODES = [
  { id: '1', name: 'Dr. Amina Boudjemaa',  location: 'Algeria', papers: 84  },
  { id: '3', name: 'Prof. Mohamed Cherif', location: 'Algeria', papers: 120 },
  { id: '4', name: 'Dr. Leila Hamdi',      location: 'Algeria', papers: 51  },
  { id: '6', name: 'Dr. Karim Benali',     location: 'Algeria', papers: 63  },
  { id: '8', name: 'Prof. Sara Mansouri',  location: 'Abroad',  papers: 97  },
]
export const GRAPH_EDGES = [
  { source: '1', target: '6', weight: 4 },
  { source: '1', target: '3', weight: 2 },
  { source: '1', target: '4', weight: 1 },
  { source: '3', target: '4', weight: 3 },
  { source: '3', target: '8', weight: 2 },
  { source: '6', target: '8', weight: 1 },
  { source: '4', target: '8', weight: 2 },
]

export const COUNTRIES    = ['All Countries','Algeria','Tunisia','Morocco','Egypt','Libya','France','USA','UK']
export const TYPES        = ['All','Researcher','Paper']
export const TOPICS       = ['All Topics','Artificial Intelligence','Machine Learning','Computer Vision','Natural Language Processing','Biotechnology','Medicine','Physics','Mathematics','Robotics']
export const SORT_OPTIONS = ['Relevance','Most Recent','Most Citations']

/**
 * Central filter + sort function.
 * Used by both Search page and any future page that needs filtering.
 */
export function applyFilters(items, { query = '', type = 'All', topic = 'All Topics', country = 'All Countries', sortBy = 'Relevance' }) {
  let res = items.filter(r => {
    const text = [r.name, r.title, r.authors, r.institution, ...(r.topics || [])].join(' ').toLowerCase()
    const matchQ       = !query  || text.includes(query.toLowerCase())
    const matchType    = type    === 'All'          || r.type === type.toLowerCase()
    const matchTopic   = topic   === 'All Topics'   || r.topics?.includes(topic)
    const matchCountry = country === 'All Countries' || r.location === country
    return matchQ && matchType && matchTopic && matchCountry
  })
  if (sortBy === 'Most Recent')    res = [...res].sort((a, b) => (b.year  || 0) - (a.year  || 0))
  if (sortBy === 'Most Citations') res = [...res].sort((a, b) => (b.citations || b.papers || 0) - (a.citations || a.papers || 0))
  return res
}