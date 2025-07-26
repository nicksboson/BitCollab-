import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import Home from './Home'
import Login from './Login'
import Signup from './Signup'
import Navbar from './Navbar'
import Footer from './Footer'
import CreateRoom from './CreateRoom'
import JoinRoom from './JoinRoom'
import HostRoom from './HostRoom'
import ParticipantRoom from './ParticipantRoom'
import { useEffect, useState } from 'react';
import axios from 'axios';

function RoomRouter() {
  const { roomCode } = useParams();
  const [isHost, setIsHost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkHost = async () => {
      let username = localStorage.getItem(`user_${roomCode}`);
      if (username) username = username.trim().toLowerCase();
      if (!username) {
        setIsHost(false);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/api/rooms/${roomCode}`);
        let creator = response.data.room.creator;
        if (creator) creator = creator.trim().toLowerCase();
        const isHostUser = creator === username;
        setIsHost(isHostUser);
      } catch (error) {
        setIsHost(false);
      }
    };
    checkHost();
  }, [roomCode, navigate]);

  if (isHost === null) return <div>Loading...</div>;
  return isHost ? <HostRoom /> : <ParticipantRoom />;
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/room/:roomCode" element={<RoomRouter />} />
          <Route path="/participant/:roomCode" element={<ParticipantRoom />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  )
}

export default App
