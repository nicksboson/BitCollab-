import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Lightning from './Lightning';

function Home() {
  const [message, setMessage] = useState('')
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/')
      .then(res => setMessage(res.data))
      .catch(console.error)
    if (localStorage.getItem('welcome')) {
      setShowWelcome(true);
      localStorage.removeItem('welcome');
    }
  }, [])

  return (
    <>
      <Lightning
        hue={220}
        xOffset={0}
        speed={2}
        intensity={2}
        size={3}
      />
      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)',
          color: '#fff',
          padding: '1.2rem 0',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '1.2rem',
          zIndex: 3000,
          boxShadow: '0 2px 16px 0 rgba(58,41,255,0.13)',
        }}>
          Welcome! You have successfully logged in.
          <button onClick={() => setShowWelcome(false)} style={{ marginLeft: 24, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.3rem 1rem', fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

    <div style={{
        minHeight: '100vh',
        width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      background: 'none',
        position: 'relative',
        zIndex: 2,
        padding: '2rem 0',
      }}>
      <div style={{
          background: 'rgba(30, 30, 40, 0.65)',
          borderRadius: '2rem',
          boxShadow: '0 8px 40px 0 rgba(58,41,255,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.10)',
          padding: '3.5rem 2.8rem',
          maxWidth: 540,
          width: '92%',
        textAlign: 'center',
          border: '1.5px solid rgba(255,255,255,0.13)',
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          margin: '0 auto',
          transition: 'box-shadow 0.2s',
      }}>
          <h1 style={{
            fontSize: '2.7rem',
            fontWeight: 900,
            marginBottom: 18,
            letterSpacing: 1.2,
            background: 'linear-gradient(90deg, #3A29FF 40%, #FF94B4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            Welcome to Bit Collab
          </h1>
          <p style={{
            fontSize: '1.18rem',
            color: '#e0e0e0',
            marginBottom: 36,
            fontWeight: 500,
            letterSpacing: 0.2,
            textShadow: '0 1px 8px rgba(58,41,255,0.08)',
          }}>
          Collaborate, build, and innovate together on a modern platform.
        </p>
          <div style={{
            display: 'flex',
            gap: '1.3rem',
            justifyContent: 'center',
            marginBottom: 18,
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => navigate('/create-room')}
              style={{
                display: 'inline-block',
                padding: '1.05rem 2.5rem',
                fontSize: '1.13rem',
                fontWeight: 700,
                color: '#fff',
                background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)',
                border: 'none',
                borderRadius: '14px',
                boxShadow: '0 2px 16px rgba(58,41,255,0.13)',
                cursor: 'pointer',
                opacity: 1,
                textDecoration: 'none',
                transition: 'background 0.18s, transform 0.12s, box-shadow 0.18s',
                outline: 'none',
                marginBottom: '0.5rem',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #4B3AFF 60%, #FFB4D4 100%)'}
              onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)'}
              onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px #3A29FF55'}
              onBlur={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(58,41,255,0.13)'}
            >
              Create Room
            </button>
            <button
              onClick={() => navigate('/join-room')}
              style={{
                display: 'inline-block',
                padding: '1.05rem 2.5rem',
                fontSize: '1.13rem',
                fontWeight: 700,
                color: '#fff',
                background: 'linear-gradient(90deg, #FF3232 60%, #FF94B4 100%)',
                border: 'none',
                borderRadius: '14px',
                boxShadow: '0 2px 16px rgba(255,50,50,0.13)',
                cursor: 'pointer',
                opacity: 1,
                textDecoration: 'none',
                transition: 'background 0.18s, transform 0.12s, box-shadow 0.18s',
                outline: 'none',
                marginBottom: '0.5rem',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #FF5050 60%, #FFB4D4 100%)'}
              onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #FF3232 60%, #FF94B4 100%)'}
              onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px #FF323255'}
              onBlur={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(255,50,50,0.13)'}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home 