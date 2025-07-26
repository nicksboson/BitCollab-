import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateRoom() {
  const [formData, setFormData] = useState({
    roomName: '',
    creator: ''
  });
  const [loading, setLoading] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState('');
  const [copiedFlash, setCopiedFlash] = useState(false);
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
      const response = await axios.post('http://localhost:5000/api/rooms/create', formData);
      setRoomData(response.data.room);
      // Set localStorage for host immediately
      if (response.data.room && response.data.room.roomCode && response.data.room.creator) {
        localStorage.setItem(`user_${response.data.room.roomCode}`, response.data.room.creator);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomData.roomCode);
    setCopiedFlash(true);
    setTimeout(() => setCopiedFlash(false), 2000);
  };

  const goToRoom = () => {
    // Store creator as user_<roomCode> in localStorage
    if (roomData && roomData.roomCode && roomData.creator) {
      localStorage.setItem(`user_${roomData.roomCode}`, roomData.creator);
    }
    navigate(`/room/${roomData.roomCode}`);
  };

  if (roomData) {
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
              background: 'linear-gradient(90deg, #3A29FF 40%, #FF94B4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Room Created!
            </h1>
            
            <div style={{
              background: 'rgba(58,41,255,0.1)',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid rgba(58,41,255,0.2)',
            }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#e0e0e0' }}>
                Room Code
              </h3>
              <div style={{
                fontSize: '3rem',
                fontWeight: 900,
                letterSpacing: '0.5rem',
                color: '#FF94B4',
                marginBottom: '1rem',
                fontFamily: 'monospace',
              }}>
                {roomData.roomCode}
              </div>
              <p style={{ color: '#bbb', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Share this code with your coworkers to join the room
              </p>
              <button
                onClick={copyRoomCode}
                style={{
                  background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.8rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginRight: '1rem',
                  transition: 'transform 0.1s',
                }}
              >
                Copy Code
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#e0e0e0' }}>
                Room Details
              </h4>
              <p style={{ color: '#bbb', marginBottom: '0.5rem' }}>
                <strong>Name:</strong> {roomData.roomName}
              </p>
              <p style={{ color: '#bbb', marginBottom: '0.5rem' }}>
                <strong>Creator:</strong> {roomData.creator}
              </p>
              <p style={{ color: '#bbb' }}>
                <strong>Participants:</strong> {roomData.participants.length}/{roomData.maxParticipants}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={goToRoom}
                style={{
                  background: 'linear-gradient(90deg, #FF3232 60%, #FF94B4 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                }}
              >
                Enter Room
              </button>
              <button
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
                Back to Home
              </button>
            </div>
          </div>
        </div>
        {copiedFlash && (
          <div style={{
            position: 'fixed',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(58,41,255,0.95)',
            color: '#fff',
            padding: '0.8rem 2rem',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '1.1rem',
            zIndex: 3000,
            boxShadow: '0 2px 16px 0 rgba(58,41,255,0.13)',
            letterSpacing: '0.03em',
            transition: 'opacity 0.2s',
          }}>
            Room code copied to clipboard!
          </div>
        )}
      </>
    );
  }

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
            background: 'linear-gradient(90deg, #3A29FF 40%, #FF94B4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Create a Room
          </h1>
          
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#e0e0e0' }}>
                Your Name *
              </label>
        <input
          type="text"
                name="creator"
                value={formData.creator}
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

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#e0e0e0' }}>
                Room Name
              </label>
              <input
                type="text"
                name="roomName"
                value={formData.roomName}
                onChange={handleInputChange}
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
                placeholder="Enter room name (optional)"
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
                  background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)',
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
                {loading ? 'Creating...' : 'Create Room'}
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

export default CreateRoom; 