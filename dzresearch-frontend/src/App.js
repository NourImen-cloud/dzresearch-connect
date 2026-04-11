import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home   from './pages/Home'
import Search from './pages/Search'
import './styles/global.css'
import GraphDemo from './pages/GraphDemo'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"       element={<Home />}   />
        <Route path="/search" element={<Search />} />
        <Route path="/graph-demo" element={<GraphDemo/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App