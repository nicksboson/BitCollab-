import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function JoinRoom() {
  const [formData, setFormData] = useState({
    roomCode: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/rooms/join', {
        roomCode: formData.roomCode.toUpperCase(),
        userId: formData.username, // Using username as userId for simplicity
        username: formData.username
      });
      
      console.log('Join response:', response.data); // Debug log
      
      // Set localStorage for the user
      localStorage.setItem(`user_${formData.roomCode.toUpperCase()}`, formData.username);
      
      // Check if user is the creator (host) or a participant
      if (response.data.message === 'Successfully joined room as host') {
        console.log('Navigating to host room'); // Debug log
        // User is the host, navigate to host room
        navigate(`/room/${formData.roomCode.toUpperCase()}`);
      } else {
        console.log('Navigating to participant room'); // Debug log
        // User is a participant, navigate to participant room
        navigate(`/participant/${formData.roomCode.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Join error:', err); // Debug log
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: '2rem',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          background: 'rgba(30, 30, 40, 0.65)',
          borderRadius: '2rem',
          boxShadow: '0 8px 40px 0 rgba(58,41,255,0.10)',
          padding: '3rem',
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          border: '1.5px solid rgba(255,255,255,0.13)',
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
        }}>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            marginBottom: 24,
            background: 'linear-gradient(90deg, #FF3232 40%, #FF94B4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Join a Room
          </h1>
          
          <p style={{
            color: '#bbb',
            fontSize: '1rem',
            marginBottom: '2rem',
            lineHeight: 1.5,
          }}>
            Enter the room code provided by your coworker to join their collaborative session
          </p>
          
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#e0e0e0' }}>
                Room Code *
              </label>
              <input
                type="text"
                name="roomCode"
                value={formData.roomCode}
                onChange={handleInputChange}
                required
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '1.2rem',
                  outline: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
                placeholder="ABCD12"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#e0e0e0' }}>
                Your Name *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                placeholder="Enter your name"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,50,50,0.2)',
                color: '#FF94B4',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255,50,50,0.3)',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(90deg, #FF3232 60%, #FF94B4 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'transform 0.1s',
                }}
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default JoinRoom; 