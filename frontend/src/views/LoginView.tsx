import React, { useState } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, Mail, User as UserIcon } from 'lucide-react';

export default function LoginView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [specialization, setSpecialization] = useState('CLEANING');
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [studentBlock, setStudentBlock] = useState('A');
  const [studentRoom, setStudentRoom] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isResetMode) {
        const res = await api.post('/auth/reset-password', { email, new_password: password });
        alert(res.data.message);
        setIsResetMode(false);
      } else if (isLogin) {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.token, res.data.user);
        navigate('/');
      } else {
        const payloadRoom = role === 'STUDENT' ? `Block ${studentBlock} - ${studentRoom}` : undefined;
        const res = await api.post('/auth/signup', { name, email, password, room_number: payloadRoom, role, specialization });
        if (res.data.token) {
          login(res.data.token, res.data.user);
          navigate('/');
        } else {
          alert(res.data.message);
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '50%', marginBottom: '1rem' }}>
            <Building2 size={32} color="var(--primary)" />
          </div>
          <h2>Smart Hostel</h2>
          <p>Maintenance & Cleaning Management</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
          <button 
            type="button"
            style={{ flex: 1, padding: '10px', background: isLogin && !isResetMode ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { setIsLogin(true); setIsResetMode(false); }}
          >
            Login
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '10px', background: !isLogin && !isResetMode ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { setIsLogin(false); setIsResetMode(false); }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Register As</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setRole('STUDENT')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: role === 'STUDENT' ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: role === 'STUDENT' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Student</button>
                  <button type="button" onClick={() => setRole('STAFF')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: role === 'STAFF' ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: role === 'STAFF' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>Staff</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label"><UserIcon size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Full Name</label>
                <input type="text" className="form-control" value={name} onChange={r => setName(r.target.value)} required />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label"><Mail size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Email Address</label>
            <input type="email" className="form-control" value={email} onChange={r => setEmail(r.target.value)} required />
            {isResetMode && <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Enter the email associated with your account.</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <KeyRound size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 
              {isResetMode ? 'New Password' : 'Password'}
            </label>
            <input type="password" className="form-control" value={password} onChange={r => setPassword(r.target.value)} required />
          </div>

          {!isLogin && role === 'STUDENT' && !isResetMode && (
            <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label"><Building2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Block</label>
                <select className="form-control" value={studentBlock} onChange={r => setStudentBlock(r.target.value)}>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label className="form-label">Room Number</label>
                <input type="text" className="form-control" placeholder="e.g. 101" value={studentRoom} onChange={r => setStudentRoom(r.target.value)} required />
              </div>
            </div>
          )}

          {!isLogin && role === 'STAFF' && (
            <div className="form-group">
              <label className="form-label"><Building2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Trade Specialization</label>
              <select className="form-control" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                <option value="CLEANING">Cleaning</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="WATER">Water/Plumbing</option>
                <option value="WASTE">Waste Management</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {isResetMode ? 'Reset Password' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {isLogin && !isResetMode && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button type="button" onClick={() => setIsResetMode(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Forgot Password?
            </button>
          </div>
        )}
        

      </div>
    </div>
  );
}
