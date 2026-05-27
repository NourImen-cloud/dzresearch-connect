import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { isAuthenticated, email, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">

        <Link to="/" className="navbar__logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 120" width="90" height="80">

            <rect width="100" height="100" rx="24" fill="#0f1729"/>

            <circle cx="52" cy="52" r="28" fill="none" stroke="#f5a623" stroke-width="3.5"/>

            <circle cx="52" cy="45" r="6.5" fill="#f5a623"/>
            <circle cx="38" cy="60" r="5"   fill="#1D9E75"/>
            <circle cx="66" cy="60" r="5"   fill="#7F77DD"/>
            <circle cx="45" cy="33" r="4"   fill="#7F77DD" opacity="0.75"/>

            <line x1="52" y1="45" x2="38" y2="60" stroke="white" stroke-width="1.5" stroke-opacity="0.5"/>
            <line x1="52" y1="45" x2="66" y2="60" stroke="white" stroke-width="1.5" stroke-opacity="0.5"/>
            <line x1="52" y1="45" x2="45" y2="33" stroke="white" stroke-width="1.5" stroke-opacity="0.4"/>

            <line x1="73" y1="73" x2="92" y2="92" stroke="#f5a623" stroke-width="5" stroke-linecap="round"/>
          </svg>
          <span className="navbar__logo-text">DZresearch</span>
        </Link>

        <ul className="navbar__links">
          <li>
            <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'navbar__link--active' : ''}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/search" className={`navbar__link ${location.pathname === '/search' ? 'navbar__link--active' : ''}`}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{marginRight: 5, verticalAlign: 'middle'}}>
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="10" y1="10" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Search
            </Link>
          </li>
          <li>
            <Link
              to="/graph-demo"
              className={`navbar__link ${location.pathname === '/graph-demo' ? 'navbar__link--active' : ''}`}
              title="AI view: researchers who look similar on paper (not who wrote together)"
            >
              Similarity map
            </Link>
          </li>
          <li>
            <Link
              to="/chatbot"
              className={`navbar__link ${location.pathname === '/chatbot' ? 'navbar__link--active' : ''}`}
            >
              Assistant
            </Link>
          </li>
          {!isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/login"
                  className={`navbar__link ${location.pathname === '/login' ? 'navbar__link--active' : ''}`}
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className={`navbar__link navbar__link--cta ${location.pathname === '/register' ? 'navbar__link--active' : ''}`}
                >
                  Sign up
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/account/digests"
                  className={`navbar__link ${location.pathname === '/account/digests' ? 'navbar__link--active' : ''}`}
                  title="Weekly email: papers and researchers from our catalog matching your saved filters"
                >
                  Email digest
                </Link>
              </li>
              <li>
                <span className="navbar__user" title={email}>
                  {email}
                </span>
              </li>
              <li>
                <button type="button" className="navbar__link" onClick={logout}>
                  Log out
                </button>
              </li>
            </>
          )}
        </ul>

      </div>
    </nav>
  )
}