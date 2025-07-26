import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import Workspace from './Workspace';

const SOCKET_URL = 'http://localhost:5000';

function normalizeId(id) {
  return typeof id === 'string' ? id.trim().toLowerCase() : id;
}

function ParticipantRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [deniedReason, setDeniedReason] = useState('');
  const [removed, setRemoved] = useState(false);
  const [hasRequestedJoin, setHasRequestedJoin] = useState(false);
  const [showJoinLoader, setShowJoinLoader] = useState(false);
  const socketRef = useRef(null);
  const [copiedFlash, setCopiedFlash] = useState(false);

  useEffect(() => {
    console.log('ParticipantRoom - useEffect triggered'); // Debug log
    console.log('ParticipantRoom - roomCode:', roomCode); // Debug log
    
    let username = localStorage.getItem(`user_${roomCode}`);
    if (username) username = normalizeId(username);
    console.log('ParticipantRoom - username from localStorage:', username); // Debug log
    
    if (!username) {
      console.log('ParticipantRoom - No username found, prompting user'); // Debug log
      username = prompt('Enter your name (participant):');
      if (!username) {
        navigate('/');
        return;
      }
      username = normalizeId(username);
      localStorage.setItem(`user_${roomCode}`, username);
    }
    setCurrentUser(username);

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('register-user', { userId: username });
    socket.emit('join-room', roomCode.toUpperCase());
    
    console.log('ParticipantRoom - Socket connected, userId:', username); // Debug log
    console.log('ParticipantRoom - Joined room:', roomCode.toUpperCase()); // Debug log

    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`${SOCKET_URL}/api/rooms/${roomCode}`);
        setRoomData(response.data.room);
        setLoading(false);
        
        // Check if user is already in participants list
        const isAlreadyParticipant = response.data.room.participants && 
          response.data.room.participants.some(p => normalizeId(p.userId) === username);
        
        console.log('ParticipantRoom - fetchRoomData - Is already participant:', isAlreadyParticipant); // Debug log
        
        // If user is the creator, redirect to host page
        if (normalizeId(response.data.room.creator) === username) {
          navigate(`/room/${roomCode}`);
        }
        // If user is already a participant, don't show waiting approval
        else if (isAlreadyParticipant) {
          console.log('ParticipantRoom - User is already participant, setting waitingApproval to false'); // Debug log
          setWaitingApproval(false);
          setHasRequestedJoin(true); // Prevent sending more requests
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load room');
        setLoading(false);
      }
    };
    fetchRoomData();

    socket.on('room-updated', fetchRoomData);
    socket.on('participant-joined', ({ userId, username }) => {
      // Show notification when someone joins
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(58,41,255,0.9);
        color: #fff;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
      `;
      notification.textContent = `${username} joined the room!`;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    });
    socket.on('participant-left', ({ userId, username }) => {
      // Show notification when someone leaves
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255,50,50,0.9);
        color: #fff;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
      `;
      notification.textContent = `${username} left the room.`;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    });
    socket.on('join-approved', () => {
      console.log('Participant received join-approved event'); // Debug log
      setShowJoinLoader(true);
      setTimeout(() => {
        setShowJoinLoader(false);
        setWaitingApproval(false);
        setHasRequestedJoin(false); // Reset the flag
        fetchRoomData();
        setTimeout(() => {
          fetchRoomData();
        }, 500);
      }, 1000);
    });
    socket.on('join-denied', ({ reason }) => {
      setDeniedReason(reason || 'Join request denied');
      setWaitingApproval(false);
      setHasRequestedJoin(false); // Reset the flag
      setTimeout(() => navigate('/'), 2000);
    });
    socket.on('removed-from-room', () => {
      setRemoved(true);
      setTimeout(() => navigate('/'), 2000);
    });

    return () => {
      socket.emit('leave-room', roomCode.toUpperCase());
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [roomCode, navigate]);

  // Request to join and wait for approval
  useEffect(() => {
    console.log('ParticipantRoom - Request join effect triggered'); // Debug log
    console.log('ParticipantRoom - loading:', loading, 'roomData:', !!roomData, 'currentUser:', currentUser, 'hasRequestedJoin:', hasRequestedJoin); // Debug log
    
    // Check if user is already in participants list
    const isAlreadyParticipant = roomData && roomData.participants && 
      roomData.participants.some(p => normalizeId(p.userId) === normalizeId(currentUser));
    
    console.log('ParticipantRoom - Is already participant:', isAlreadyParticipant); // Debug log
    
    if (!loading && roomData && normalizeId(roomData.creator) !== normalizeId(currentUser) && !hasRequestedJoin && !isAlreadyParticipant) {
      console.log('ParticipantRoom - Sending join request for user:', currentUser); // Debug log
      setWaitingApproval(true);
      setHasRequestedJoin(true);
      socketRef.current.emit('request-join-room', {
        roomCode: roomCode.toUpperCase(),
        userId: normalizeId(currentUser),
        username: normalizeId(currentUser)
      });
    } else {
      console.log('ParticipantRoom - Not sending join request. Conditions not met.'); // Debug log
      if (isAlreadyParticipant) {
        console.log('ParticipantRoom - User is already a participant, not sending request'); // Debug log
      }
    }
    // eslint-disable-next-line
  }, [loading, roomData, currentUser, hasRequestedJoin]);

  const leaveRoom = async () => {
    try {
      await axios.post(`${SOCKET_URL}/api/rooms/leave`, {
        roomCode,
        userId: normalizeId(currentUser)
      });
      localStorage.removeItem(`user_${roomCode}`);
      navigate('/');
    } catch (err) {
      navigate('/');
    }
  };
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedFlash(true);
    setTimeout(() => setCopiedFlash(false), 2000);
  };

  if (loading) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)' }}>
            <h2>Loading room...</h2>
          </div>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)' }}>
            <h2 style={{ color: '#FF94B4', marginBottom: '1rem' }}>Error</h2>
            <p style={{ marginBottom: '2rem' }}>{error}</p>
            <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Back to Home</button>
          </div>
        </div>
      </>
    );
  }
  if (showJoinLoader) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)' }}>
            <h2 style={{ color: '#3A29FF', marginBottom: '1rem' }}>Entering Room...</h2>
            <div style={{ width: '50px', height: '50px', border: '3px solid rgba(58,41,255,0.3)', borderTop: '3px solid #3A29FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          </div>
        </div>
      </>
    );
  }
  if (waitingApproval) {
    console.log('ParticipantRoom - Rendering waiting approval screen'); // Debug log
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)' }}>
            <h2 style={{ color: '#FF94B4', marginBottom: '1rem' }}>Waiting for Approval</h2>
            <p style={{ marginBottom: '2rem' }}>Your join request has been sent to the host. Please wait...</p>
            <div style={{ width: '50px', height: '50px', border: '3px solid rgba(58,41,255,0.3)', borderTop: '3px solid #3A29FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <p style={{ fontSize: '0.8rem', color: '#bbb', marginTop: '1rem' }}>Debug: waitingApproval = {waitingApproval.toString()}</p>
          </div>
        </div>
      </>
    );
  }
  if (deniedReason) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)' }}>
            <h2 style={{ color: '#FF3232', marginBottom: '1rem' }}>Join Denied</h2>
            <p style={{ marginBottom: '2rem' }}>{deniedReason}</p>
            <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Back to Home</button>
          </div>
        </div>
      </>
    );
  }
  if (removed) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)' }}>
            <h2 style={{ color: '#FF94B4', marginBottom: '1rem' }}>Removed from Room</h2>
            <p style={{ marginBottom: '2rem' }}>You have been removed by the host.</p>
            <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Back to Home</button>
          </div>
        </div>
      </>
    );
  }

  console.log('ParticipantRoom - Rendering full room interface'); // Debug log
  return (
    <>
      <div style={{ minHeight: '100vh', color: '#fff', position: 'relative', zIndex: 2, padding: '2rem' }}>
        {/* Room Header */}
        <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '1.5rem', padding: '1.5rem 2rem', marginBottom: '2rem', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(90deg, #3A29FF 40%, #FF94B4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{roomData.roomName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FF94B4', fontFamily: 'monospace', letterSpacing: '0.3rem' }}>{roomData.roomCode}</span>
              <button onClick={copyRoomCode} style={{ background: 'rgba(58,41,255,0.2)', color: '#fff', border: '1px solid rgba(58,41,255,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }}>Copy Code</button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#bbb', marginBottom: '0.5rem' }}>Participants: {roomData.participants.length}/{roomData.maxParticipants}</p>
            <button onClick={leaveRoom} style={{ background: 'linear-gradient(90deg, #FF3232 60%, #FF94B4 100%)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Leave Room</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)' }}>
          {/* Participants Sidebar */}
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '1.5rem', padding: '1.5rem', width: '300px', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)', flexShrink: 0 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: '#e0e0e0' }}>Participants</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {roomData.participants.map((participant, index) => {
                const isHostUser = participant.userId && roomData.creator && normalizeId(participant.userId) === normalizeId(roomData.creator);
                const isCurrentUser = participant.userId && currentUser && normalizeId(participant.userId) === normalizeId(currentUser);
                return (
                  <div key={participant.userId} style={{ background: isCurrentUser ? 'rgba(58,41,255,0.2)' : 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: isCurrentUser ? '1px solid rgba(58,41,255,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isHostUser ? '#FF94B4' : '#3A29FF' }} />
                      <span style={{ fontWeight: 600, color: isCurrentUser ? '#FF94B4' : '#fff' }}>{participant.username}</span>
                      {isHostUser && (
                        <span style={{ background: 'rgba(255,148,180,0.2)', color: '#FF94B4', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>Host</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#bbb', marginTop: '0.3rem' }}>Joined {participant.joinedAt ? new Date(participant.joinedAt).toLocaleTimeString() : 'N/A'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Collaboration Area */}
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '1.5rem', flex: 1, border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)', minHeight: 0, display: 'flex' }}>
            <div style={{ width: '100%', height: '100%' }}>
              <Workspace roomCode={roomData.roomCode} />
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
      </div>
    </>
  );
}

export default ParticipantRoom; 