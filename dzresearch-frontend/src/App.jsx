import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Search from './pages/Search'
import './styles/global.css'
import GraphDemo from './pages/GraphDemo'
import ResearcherProfile from './pages/ResearcherProfile'
import PaperProfile from './pages/PaperProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import DigestAccount from './pages/DigestAccount'
import Chatbot from './pages/Chatbot'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/graph-demo" element={<GraphDemo />} />
          <Route path="/researcher/:id" element={<ResearcherProfile />} />
          <Route path="/paper/:id" element={<PaperProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account/digests" element={<DigestAccount />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
