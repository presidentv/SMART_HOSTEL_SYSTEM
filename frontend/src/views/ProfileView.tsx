import React, { useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { User, Building2, Save } from 'lucide-react';

const ProfileView: React.FC = () => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [roomNumber, setRoomNumber] = useState(user?.room_number || '');
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', { name, room_number: roomNumber });
      login(localStorage.getItem('token') || '', res.data.user);
      setMsg(res.data.message);
      setTimeout(() => setMsg(''), 3000);
    } catch(err) {
      console.error(err);
      setMsg('Error updating profile');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '4rem auto' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><User /> Edit Profile</h2>
        {msg && <div className="badge badge-completed" style={{ display: 'block', marginBottom: '1rem', padding: '12px' }}>{msg}</div>}
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" value={name} onChange={r => setName(r.target.value)} required />
          </div>
          {user?.role === 'STUDENT' && (
            <div className="form-group">
              <label className="form-label"><Building2 size={14} style={{ marginRight: '6px' }}/> Room Number</label>
              <input type="text" className="form-control" value={roomNumber} onChange={r => setRoomNumber(r.target.value)} required />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Save size={18} /> Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileView;
