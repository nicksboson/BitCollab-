import { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GOOGLE_CLIENT_ID = '511117420048-fjnoij5t6odb9fgrlhla5p2bv6sn2taq.apps.googleusercontent.com';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form);
      if (res.data.token) localStorage.setItem('token', res.data.token);
      localStorage.setItem('welcome', '1');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.post('http://localhost:5000/api/auth/google', { credential: credentialResponse.credential });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      localStorage.setItem('welcome', '1');
      navigate('/');
    } catch (err) {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', zIndex: 2 }}>
        <form onSubmit={handleSubmit} style={{ background: 'rgba(30, 30, 40, 0.65)', borderRadius: '2rem', padding: '3rem', textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(18px) saturate(1.3)', minWidth: 320 }}>
          <h2 style={{ marginBottom: '2rem' }}>Login</h2>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required autoComplete="email" style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required autoComplete="current-password" style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#3A29FF', color: '#fff', fontWeight: 600, border: 'none', marginBottom: 16 }}>Login</button>
          <div style={{ margin: '1.5rem 0' }}>or</div>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google login failed')} width="100%" />
          {error && <div style={{ color: '#FF94B4', marginTop: 16 }}>{error}</div>}
        </form>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;

