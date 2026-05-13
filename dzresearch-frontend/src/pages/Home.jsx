import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Home.css'
import pic from '../images/AlgeriaNetwork.png';
import SearchBar from '../components/Searchbar';
import { Link } from 'react-router-dom';
import { getStats } from '../services/api'
import { useAuth } from '../context/AuthContext'

/* ─── How It Works steps ──────────────────────────────────── */
const STEPS = [
  {
    step: 'Step 1',
    icon: <SearchStepIcon />,
    title: 'Search researchers or topics',
    desc:  'Use our powerful search engine to discover researchers, papers, and topics across Algeria. Filter by country, research type, or specific topics to find exactly what you\'re looking for.',
    features: ['Advanced Filters — Narrow down results by country, type, and research topics', 'Smart Search — Find researchers and papers with intelligent keyword matching', 'Instant Results — Get relevant results sorted by relevance score'],
    accent: 'gold',
    image: <AlgeriaNetwork />,
    flip: false,
  },
  {
    step: 'Step 2',
    icon: <ProfileStepIcon />,
    title: 'Explore profiles and papers',
    desc:  'Browse detailed researcher profiles including their publications, research interests, and affiliations. Explore papers with full citations and relevance scores.',
    features: ['Detailed Profiles — View researcher backgrounds, publications, and expertise', 'Paper Metadata — Access paper titles, authors, citations, and topics', 'Relevance Scoring — See how well each result matches your search'],
    accent: 'navy',
    image: <ProfileIllustration />,
    flip: true,
  },
  {
    step: 'Step 3',
    icon: <AIStepIcon />,
    title: 'Get AI-powered recommendations',
    desc:  'Our AI analyzes research patterns and interests to suggest relevant researchers and papers you might have missed. Discover new connections and opportunities.',
    features: ['Smart Suggestions — AI recommends researchers based on your interests', 'Related Papers — Discover papers similar to ones you\'ve viewed', 'Pattern Recognition — System learns from your search behavior over time'],
    accent: 'gold',
    image: <AIIllustration />,
    flip: false,
  },
  {
    step: 'Step 4',
    icon: <NetworkStepIcon />,
    title: 'Co-authors, similarity map & email digest',
    desc:  'On each profile, open the Co-authors tab to see who published together in our data. Use the Similarity map in the menu for AI “look-alikes”. Log in and open Email digest to get a weekly catalog email matching your interests.',
    features: ['Co-authors tab — Shared-paper network on every researcher profile', 'Similarity map — AI-based related researchers (menu link)', 'Email digest — Weekly list from our catalog when you are logged in'],
    accent: 'navy',
    image: <NetworkIllustration />,
    flip: true,
  },
]

/* ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, profileListingPending, refreshSession } = useAuth()
  const [dismissPendingBanner, setDismissPendingBanner] = useState(false)
  const [stats, setStats] = useState({
    total_researchers: '477+',
    total_papers:      '21k+',
    topics:            '50+',
    countries:         '25+',
  })

  useEffect(() => {
    getStats()
      .then(s => {
        if (s) setStats(s)
      })
      .catch(() => {/* keep defaults */})
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      refreshSession()
    }
  }, [isAuthenticated, refreshSession])

  const STATS = [
    { icon: <PeopleIcon />, value: stats.total_researchers?.toLocaleString?.() ?? stats.total_researchers, label: 'Researchers' },
    { icon: <PaperIcon />,  value: stats.total_papers?.toLocaleString?.()     ?? stats.total_papers,      label: 'Papers'      },
    { icon: <TopicIcon />,  value: stats.topics  ?? '50+',                                                label: 'Topics'      },
    { icon: <GlobeIcon />,  value: stats.countries ?? '25+',                                              label: 'Countries'   },
  ]

  const handleSearch = ({ query, country, type, topic }) => {
    if (!query.trim()) return
    const params = new URLSearchParams({ q: query })
    if (country !== 'All Countries') params.set('country', country)
    if (type    !== 'All')           params.set('type',    type)
    if (topic   !== 'All Topics')    params.set('topic',   topic)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className="home">
      {isAuthenticated && profileListingPending && !dismissPendingBanner && (
        <div className="home-pending-banner" role="status">
          <p className="home-pending-banner__text">
            <strong>Your listing request is in progress.</strong>{' '}
            We could not match your OpenAlex profile to a researcher in our catalog yet. You can use
            your account normally; we will review and add your profile when possible.
          </p>
          <button
            type="button"
            className="home-pending-banner__dismiss"
            onClick={() => setDismissPendingBanner(true)}
          >
            Dismiss
          </button>
        </div>
      )}
      <section className="hero">
        <div className="hero__bg-dots" />
        <div className="hero__content">
          <div className="hero__badge">Algeria's Research Network</div>
          <h1 className="hero__title">
            Discover, Connect<br />
            and <span className="hero__title-accent">Research</span>
          </h1>
          <p className="hero__subtitle">
            Connect with researchers, explore cutting-edge papers, and build<br />
            collaborative networks across Algeria's academic and research community.
          </p>

          {/* Search bar */}
          <SearchBar
            onSearch={handleSearch}
            variant="hero"
          />
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          {STATS.map(s => (
            <div key={s.label} className="stat">
              <span className="stat__icon">{s.icon}</span>
              <span className="stat__value">{s.value}</span>
              <span className="stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-discover" aria-labelledby="home-discover-title">
        <div className="home-discover__inner">
          <h2 id="home-discover-title" className="home-discover__title">
            Co-authors vs similarity map vs email digest
          </h2>
          <p className="home-discover__lead">
            These three tools are different — use this guide so visitors and researchers know where to look.
          </p>
          <div className="home-discover__grid">
            <article className="home-discover__card">
              <span className="home-discover__pill">On each profile</span>
              <h3 className="home-discover__card-title">Co-author map</h3>
              <p className="home-discover__card-text">
                Search for a researcher, open their profile, then open the <strong>Co-authors</strong> tab. Lines
                connect people who share <strong>at least one paper</strong> in our catalog.
              </p>
            </article>
            <article className="home-discover__card">
              <span className="home-discover__pill">Top menu</span>
              <h3 className="home-discover__card-title">Similarity map (AI)</h3>
              <p className="home-discover__card-text">
                Shows who is <strong>semantically similar</strong> using embeddings — useful discovery, but not the
                same as having written a paper together.
              </p>
              <Link to="/graph-demo" className="home-discover__link">
                Open similarity map →
              </Link>
            </article>
            <article className="home-discover__card">
              <span className="home-discover__pill">Logged-in users</span>
              <h3 className="home-discover__card-title">Weekly email digest</h3>
              <p className="home-discover__card-text">
                Save keywords and (optionally) turn on weekly emails. Each message lists a small set of{' '}
                <strong>papers and researchers already in DZresearch</strong> that match your filters — not external news.
              </p>
              {isAuthenticated ? (
                <Link to="/account/digests" className="home-discover__link">
                  Set up email digest →
                </Link>
              ) : (
                <p className="home-discover__card-foot">
                  <Link to="/login">Log in</Link>
                  {' or '}
                  <Link to="/register">register</Link>
                  {' '}— then use <strong>Email digest</strong> in the menu.
                </p>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Four simple steps to discover, connect, and collaborate with researchers</p>
        </div>

        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={i} className={`step ${s.flip ? 'step--flip' : ''}`}>
              <div className="step__text">
                <span className={`step__badge step__badge--${s.accent}`}>{s.icon}{s.step}</span>
                <h3 className="step__title">{s.title}</h3>
                <p className="step__desc">{s.desc}</p>
                <ul className="step__features">
                  {s.features.map((f, fi) => (
                    <li key={fi}>
                      <span className={`step__check step__check--${s.accent}`}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span>
                        <strong>{f.split('—')[0]}</strong>
                        {f.includes('—') ? '— ' + f.split('—')[1] : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="step__image">
                {s.image}
              </div>
            </div>
          ))}
        </div>
      </section>
      {/*__ Ready To Join ________________________________________ */}
      <section className='Ready-to-join'>
        <h3 className="Ready-to-join-title">
            Ready to Connect with Algeria's Reasearchers?
        </h3>
          <p className="hero__subtitle">
                Join the premier platform for 
                research collaboration in Algeria
          </p>
          <div className='Start-explore-btn-container'>
            <button
                type="button"
                className='Start-exploring-btn'
                onClick={() => {}}
              >
                <Link to="/search" >Start Exploring Now</Link>
            </button>
          </div>
      </section>
    </div>
  )
}

/* ─── SVG Icon components ─────────────────────────────────── */
function PeopleIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function PaperIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}
function TopicIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}
function GlobeIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
}
function SearchStepIcon() {
  return <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><line x1="14.5" y1="14.5" x2="20" y2="20"/></svg>
}
function ProfileStepIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function AIStepIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function NetworkStepIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}

/* ─── Illustration placeholders ───────────────────────────── */
function AlgeriaNetwork() {
  return (
    <div className='AlgeriaNetwork'>
        <img src={pic} alt='Algeria Network' className='AlgeriaNetwork--img' />
    </div>
  )
}
function AIIllustration() {
  return (
    <div className="illustration illustration--ai">
      <div className="ai-mock">
        <div className="ai-mock__header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>AI Recommendations</span>
        </div>
        {[90,85,80].map((score,i) => (
          <div key={i} className="ai-mock__item">
            <div className="ai-mock__item-lines">
              <div className="ai-mock__line" style={{width:`${60+i*10}%`}}/>
              <div className="ai-mock__line" style={{width:`${40+i*8}%`}}/>
            </div>
            <span className="ai-mock__score">{score}% match</span>
          </div>
        ))}
      </div>
    </div>
  )
}
function ProfileIllustration() {
  return (
    <div className="illustration illustration--profile">
      <div className="profile-mock">
        <div className="profile-mock__header">
          <div className="profile-mock__avatar"/>
          <div>
            <div className="profile-mock__line profile-mock__line--name"/>
            <div className="profile-mock__line profile-mock__line--sub"/>
          </div>
        </div>
        <div className="profile-mock__tags">
          <span/><span/><span/>
        </div>
        <div className="profile-mock__rows">
          {[1,2,3].map(i=><div key={i} className="profile-mock__row"><div className="profile-mock__bar" style={{width: `${80-i*15}%`}}/></div>)}
        </div>
      </div>
    </div>
  )
}

function NetworkIllustration() {
  return (
    <div className="illustration illustration--network">
      <svg viewBox="0 0 380 260" fill="none" xmlns="http://www.w3.org/2000/svg">
        {[[190,130,20,'#e040fb'],[100,90,14,'#f5a623'],[280,100,16,'#40c4ff'],[80,180,12,'#69f0ae'],[300,180,15,'#ff5252'],[190,210,11,'#e040fb'],[340,130,10,'#40c4ff'],[50,120,9,'#f5a623']].map(([cx,cy,r,fill],i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill={fill} opacity="0.85"/>
        ))}
        {[[190,130,100,90],[190,130,280,100],[190,130,80,180],[190,130,300,180],[190,130,190,210],[100,90,50,120],[280,100,340,130],[80,180,190,210]].map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
        ))}
      </svg>
    </div>
  )
}