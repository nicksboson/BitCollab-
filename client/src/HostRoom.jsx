// Import necessary hooks and libraries
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import Workspace from './Workspace';

// Socket server URL
const SOCKET_URL = 'http://localhost:5000';

function HostRoom() {
  // Get room code from URL params and navigation function
  const { roomCode } = useParams();
  const navigate = useNavigate();

  // State variables for room data, loading, errors, user, etc.
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [removed, setRemoved] = useState(false);
  const [feedback, setFeedback] = useState('');
  const socketRef = useRef(null);

  // Helper to normalize user IDs (trim and lowercase)
  function normalizeId(id) {
    return typeof id === 'string' ? id.trim().toLowerCase() : id;
  }

  // useEffect: Runs on mount and when roomCode/navigate changes
  useEffect(() => {
    // Get or prompt for username (host)
    let username = localStorage.getItem(`user_${roomCode}`);
    if (!username) {
      username = prompt('Enter your name (host):');
      if (!username) {
        navigate('/');
        return;
      }
      username = normalizeId(username);
      localStorage.setItem(`user_${roomCode}`, username);
    } else {
      username = normalizeId(username);
    }
    setCurrentUser(username);

    // Connect to socket.io server
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    // Register user and join room
    socket.emit('register-user', { userId: username });
    socket.emit('join-room', roomCode.toUpperCase());

    // Fetch room data from backend
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`${SOCKET_URL}/api/rooms/${roomCode}`);
        setRoomData(response.data.room);
        setPendingRequests(response.data.room.pendingRequests || []);
        console.log('HostRoom: Updated pendingRequests:', response.data.room.pendingRequests);
        setLoading(false);
        // If not the creator, redirect to participant page
        if (
          normalizeId(response.data.room.creator) !== username
        ) {
          navigate(`/participant/${roomCode}`);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load room');
        setLoading(false);
      }
    };
    fetchRoomData();

    // Socket event: join-request (when a user requests to join)
    socket.on('join-request', ({ userId, username }) => {
      setPendingRequests(prev => [...prev, { userId, username }]);
      setFeedback(`${username} wants to join the room.`);
      setTimeout(() => setFeedback(''), 3000);
    });
    // Socket event: room-updated (refresh room data)
    socket.on('room-updated', () => {
      console.log('HostRoom: room-updated event received');
      fetchRoomData();
    });
    // Socket event: participant-joined (show notification)
    socket.on('participant-joined', ({ userId, username }) => {
      setFeedback(`${username} joined the room!`);
      setTimeout(() => setFeedback(''), 3000);
      // Show a toast notification
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
      // (No reload needed)
    });
    // Socket event: participant-left (show notification)
    socket.on('participant-left', ({ userId, username }) => {
      setFeedback(`${username} left the room.`);
      setTimeout(() => setFeedback(''), 3000);
      // Show a toast notification
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
    // Socket event: removed-from-room (host removes you)
    socket.on('removed-from-room', () => {
      setRemoved(true);
      setTimeout(() => navigate('/'), 2000);
    });

    // Cleanup on unmount: leave room and disconnect socket
    return () => {
      socket.emit('leave-room', roomCode.toUpperCase());
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [roomCode, navigate]);

  // Approve a pending join request
  const handleApprove = (userId) => {
    socketRef.current.emit('approve-join', { roomCode: roomCode.toUpperCase(), userId });
    setFeedback('Participant approved!');
    setTimeout(() => setFeedback(''), 2000);
  };
  // Deny a pending join request
  const handleDeny = (userId) => {
    socketRef.current.emit('deny-join', { roomCode: roomCode.toUpperCase(), userId });
    setFeedback('Participant denied.');
    setTimeout(() => setFeedback(''), 2000);
  };
  // Remove a participant from the room
  const handleRemove = (userId) => {
    socketRef.current.emit('remove-participant', { roomCode: roomCode.toUpperCase(), userId });
    setFeedback('Participant removed.');
    setTimeout(() => setFeedback(''), 2000);
  };
  // Host leaves the room
  const leaveRoom = async () => {
    try {
      await axios.post(`${SOCKET_URL}/api/rooms/leave`, {
        roomCode,
        userId: currentUser
      });
      localStorage.removeItem(`user_${roomCode}`);
      navigate('/');
    } catch (err) {
      navigate('/');
    }
  };
  // Copy room code to clipboard
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setFeedback('Room code copied to clipboard!');
    setTimeout(() => setFeedback(''), 2000);
  };
  // Change host name (forces reload and prompt)
  const changeName = () => {
    localStorage.removeItem(`user_${roomCode}`);
    window.location.reload();
  };

  // Render loading state
  if (loading) {
    return (
      <>
        {/* Aurora background effect */}
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)' }}>
            <h2>Loading room...</h2>
          </div>
        </div>
      </>
    );
  }
  // Render error state
  if (error) {
    return (
      <>
        {/* Aurora background effect */}
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
  // Render removed-from-room state
  if (removed) {
    return (
      <>
        {/* Aurora background effect */}
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

  // Main render: room UI, participants, workspace, etc.
  return (
    <>
      {/* Aurora background effect */}
      <div style={{ minHeight: '100vh', color: '#fff', position: 'relative', zIndex: 2, padding: '2rem' }}>
        {/* Room Header: room name, code, copy, change name, leave */}
        <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '1.5rem', padding: '1.5rem 2rem', marginBottom: '2rem', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(90deg, #3A29FF 40%, #FF94B4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{roomData.roomName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FF94B4', fontFamily: 'monospace', letterSpacing: '0.3rem' }}>{roomData.roomCode}</span>
              <button onClick={copyRoomCode} style={{ background: 'rgba(58,41,255,0.2)', color: '#fff', border: '1px solid rgba(58,41,255,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }}>Copy Code</button>
              <button onClick={changeName} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }}>Change Name</button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#bbb', marginBottom: '0.5rem' }}>Participants: {roomData.participants.length}/{roomData.maxParticipants}</p>
            <button onClick={leaveRoom} style={{ background: 'linear-gradient(90deg, #FF3232 60%, #FF94B4 100%)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>Leave Room</button>
          </div>
        </div>

        {/* Feedback Banner: shows notifications */}
        {feedback && (
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
            {feedback}
          </div>
        )}

        {/* Pending Join Requests: Approve/Deny */}
        {pendingRequests.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.13)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#FF94B4' }}>Pending Join Requests</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingRequests.map(req => (
                <div key={req.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30,30,40,0.2)', borderRadius: '8px', padding: '0.7rem 1.2rem' }}>
                  <span style={{ fontWeight: 600 }}>{req.username}</span>
                  <div style={{ display: 'flex', gap: '0.7rem' }}>
                    <button onClick={() => handleApprove(req.userId)} style={{ background: 'linear-gradient(90deg, #3A29FF 60%, #FF94B4 100%)', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => handleDeny(req.userId)} style={{ background: 'rgba(255,50,50,0.2)', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Deny</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)' }}>
          {/* Participants Sidebar: list of participants, host badge, remove button */}
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '1.5rem', padding: '1.5rem', width: '300px', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)', flexShrink: 0 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: '#e0e0e0' }}>Participants</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {/* Filter out duplicate userIds */}
              {(() => {
                const uniqueParticipants = [];
                const seenUserIds = new Set();
                let hostRejoined = false;
                for (const participant of roomData.participants) {
                  if (!seenUserIds.has(participant.userId)) {
                    uniqueParticipants.push(participant);
                    seenUserIds.add(participant.userId);
                  } else if (participant.userId === roomData.creator) {
                    hostRejoined = true;
                  }
                }
                if (hostRejoined) {
                  setTimeout(() => {
                    setFeedback('Host rejoined!');
                    setTimeout(() => setFeedback(''), 2000);
                  }, 0);
                }
                return uniqueParticipants.map((participant, index) => {
                  const isHostUser = participant.userId && roomData.creator && normalizeId(participant.userId) === normalizeId(roomData.creator);
                  const isCurrentUser = participant.userId && currentUser && normalizeId(participant.userId) === normalizeId(currentUser);
                  // Debug log:
                  // console.log('participant.userId:', participant.userId, 'roomData.creator:', roomData.creator, 'currentUser:', currentUser);
                  return (
                    <div key={participant.userId} style={{ background: isCurrentUser ? 'rgba(58,41,255,0.2)' : 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: isCurrentUser ? '1px solid rgba(58,41,255,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isHostUser ? '#FF94B4' : '#3A29FF' }} />
                        <span style={{ fontWeight: 600, color: isCurrentUser ? '#FF94B4' : '#fff' }}>{participant.username}</span>
                        {/* Always show Host badge for the creator, even if it's the current user, using case-insensitive match */}
                        {isHostUser && (
                          <span style={{ background: 'rgba(255,148,180,0.2)', color: '#FF94B4', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>Host</span>
                        )}
                        {/* Only show Remove for other participants */}
                        {!isCurrentUser && (
                          <button onClick={() => handleRemove(participant.userId)} style={{ background: 'rgba(255,50,50,0.2)', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>Remove</button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#bbb', marginTop: '0.3rem' }}>Joined {participant.joinedAt ? new Date(participant.joinedAt).toLocaleTimeString() : 'N/A'}</p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Main Collaboration Area: Workspace component */}
          <div style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '1.5rem', flex: 1, border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)', minHeight: 0, display: 'flex' }}>
            <div style={{ width: '100%', height: '100%' }}>
              <Workspace roomCode={roomData.roomCode} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Export the HostRoom component
export default HostRoom; 