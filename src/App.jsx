import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SpotifyPlayer from './components/SpotifyPlayer';
import Callback from './pages/Callback';
import Login from './pages/Login';
import Play from './components/Play'

function App() {


  return (
    <Router>
    <Routes>
        <Route path="/" element={<SpotifyPlayer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
    </Routes>
</Router>
  )
}

export default App
