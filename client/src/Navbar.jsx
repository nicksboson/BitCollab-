import { Link, useNavigate } from 'react-router-dom'
import logo from './assets/1.png'

function Navbar() {
  const navigate = useNavigate();
  // Check if user is logged in by looking for a JWT token in localStorage
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const handleSignOut = () => {
    localStorage.removeItem('token');
    // Optionally clear other user info
    window.location.reload();
  };

  return (
    <nav style={{
      background: 'rgba(20, 20, 30, 0.35)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 2rem',
      boxShadow: '0 2px 16px 0 rgba(58,41,255,0.10)',
      width: '100vw',
      height: '10vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
      borderBottom: '1.5px solid rgba(255,255,255,0.10)',
      backdropFilter: 'blur(14px) saturate(1.2)',
      WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
      transition: 'background 0.2s',
    }}>
      {/* Logo/Title on the left */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 1px 8px rgba(58,41,255,0.08)' }}>BitCollab</span>
      </div>
      {/* Nav links on the right */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', margin: '1rem', fontWeight: 500, padding: '0.3rem 1.1rem', borderRadius: '8px', transition: 'background 0.18s, color 0.18s', background: 'transparent' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(58,41,255,0.13)'; e.currentTarget.style.color = '#FF94B4'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}>Home</Link>
        {!isLoggedIn && <Link to="/login" style={{ color: '#fff', textDecoration: 'none', margin: '1rem', fontWeight: 500, padding: '0.3rem 1.1rem', borderRadius: '8px', transition: 'background 0.18s, color 0.18s', background: 'transparent' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(58,41,255,0.13)'; e.currentTarget.style.color = '#FF94B4'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}>Login</Link>}
        {!isLoggedIn && <Link to="/signup" style={{ color: '#fff', textDecoration: 'none', margin: '1rem', fontWeight: 500, padding: '0.3rem 1.1rem', borderRadius: '8px', transition: 'background 0.18s, color 0.18s', background: 'transparent' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(58,41,255,0.13)'; e.currentTarget.style.color = '#FF94B4'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}>Signup</Link>}
        {isLoggedIn && <button onClick={handleSignOut} style={{ color: '#fff', background: 'linear-gradient(90deg, #FF3232 60%, #FF94B4 100%)', border: 'none', margin: '1rem', fontWeight: 600, padding: '0.3rem 1.1rem', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.18s, color 0.18s' }}>Sign Out</button>}
      </div>
    </nav>
  )
}

export default Navbar 