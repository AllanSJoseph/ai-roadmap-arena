import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RoadmapDashboard from './pages/RoadmapDashboard.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main style={{ minHeight: 'calc(100vh - 70px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/roadmaps/:id" element={<RoadmapDashboard />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
