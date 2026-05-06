import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home   from './pages/Home'
import Search from './pages/Search'
import './styles/global.css'
import GraphDemo from './pages/GraphDemo'
import ResearcherProfile from './pages/ResearcherProfile'
import PaperProfile from './pages/PaperProfile'


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                  element={<Home />}               />
        <Route path="/search"            element={<Search />}             />
        <Route path="/graph-demo"        element={<GraphDemo />}          />
        <Route path="/researcher/:id"    element={<ResearcherProfile />}  />
<Route path="/paper/:id" element={<PaperProfile />} />      </Routes>
      <Footer />
    </BrowserRouter>
    
  )
}

export default App