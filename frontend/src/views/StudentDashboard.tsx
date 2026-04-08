import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { api, useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Plus, CheckCircle, Clock, Home, MapPin } from 'lucide-react';

const getTimeTaken = (created: string, completed: string) => {
  const diff = new Date(completed).getTime() - new Date(created).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const getSlaDelay = (created: string, completed: string) => {
  const diff = new Date(completed).getTime() - new Date(created).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours > 24) {
    return Math.floor(hours - 24);
  }
  return 0;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [locationType, setLocationType] = useState<'MY_ROOM' | 'COMMON_AREA'>('MY_ROOM');
  const [commonArea, setCommonArea] = useState('Cafeteria');
  const [newRequest, setNewRequest] = useState({ category: 'CLEANING', description: '' });
  const [image, setImage] = useState<File | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roomValue = locationType === 'MY_ROOM'
        ? (user?.room_number || 'My Room')
        : `Common Area - ${commonArea}`;

      const formData = new FormData();
      formData.append('room', roomValue);
      formData.append('category', newRequest.category);
      formData.append('description', newRequest.description);
      if (image) formData.append('image', image);

      await api.post('/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormOpen(false);
      setImage(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        await api.put(`/requests/${id}/cancel`);
        fetchRequests();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleConfirm = async (id: number) => {
    if (window.confirm('Do you confirm that the task is fully completed according to the proof photo?')) {
      try {
        await api.put(`/requests/${id}/confirm`);
        fetchRequests();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReopen = async (id: number) => {
    if (window.confirm('Are you profoundly unsatisfied with the completion? This will reopen the request and send it back to staff.')) {
      try {
        await api.put(`/requests/${id}/reopen`);
        fetchRequests();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const submitFeedback = async (id: number, rating: number, comments: string) => {
    try {
      await api.post(`/requests/${id}/feedback`, { rating, comments });
      alert('Feedback submitted!');
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>My Requests</h2>
          <button className="btn btn-primary" onClick={() => setFormOpen(!formOpen)}>
            <Plus size={18} /> New Request
          </button>
        </div>

        {formOpen && (
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h3>Raise Maintenance/Cleaning Request</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
              {/* Location Type Toggle */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Location Type</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem' }}>
                  <button type="button"
                    onClick={() => setLocationType('MY_ROOM')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: locationType === 'MY_ROOM' ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: locationType === 'MY_ROOM' ? 'rgba(99,102,241,0.15)' : 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}>
                    <Home size={16} /> My Room
                  </button>
                  <button type="button"
                    onClick={() => setLocationType('COMMON_AREA')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: locationType === 'COMMON_AREA' ? '2px solid var(--primary)' : '1px solid var(--glass-border)', background: locationType === 'COMMON_AREA' ? 'rgba(99,102,241,0.15)' : 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}>
                    <MapPin size={16} /> Common Area
                  </button>
                </div>
                {locationType === 'MY_ROOM' ? (
                  <input type="text" className="form-control" value={user?.room_number || 'Not set — update your profile'} readOnly
                    style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.03)' }} />
                ) : (
                  <select className="form-control" value={commonArea} onChange={e => setCommonArea(e.target.value)}>
                    <option>Cafeteria</option>
                    <option>Laundry Room</option>
                    <option>Study Hall</option>
                    <option>Corridor</option>
                    <option>Washroom</option>
                    <option>Lobby / Reception</option>
                    <option>Stairwell</option>
                    <option>Courtyard</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={newRequest.category} onChange={e => setNewRequest({ ...newRequest, category: e.target.value })}>
                    <option value="CLEANING">Cleaning</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="WATER">Water/Plumbing</option>
                    <option value="WASTE">Waste Management</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} required value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Upload Photo (Optional)</label>
                <input type="file" className="form-control" accept="image/*" onChange={e => setImage(e.target.files ? e.target.files[0] : null)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Submit Request</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-2">
          {requests.map((req) => (
            <div key={req.id} className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status.replace('_', ' ')}</span>
                  {req.priority === 'URGENT' && <span className="badge" style={{ background: 'var(--danger)', color: 'white', marginLeft: '8px' }}>URGENT</span>}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {format(new Date(req.created_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{req.category} at {req.room}</h3>
              <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>{req.description}</p>
              
              {req.image_url && (
                <img src={`http://localhost:5000${req.image_url}`} alt="Issue" style={{maxHeight:'100px', borderRadius:'8px', marginBottom:'1rem', alignSelf:'flex-start'}} />
              )}

              {req.assignment?.after_image && (
                <div style={{marginBottom: '1rem'}}>
                  <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Proof of Completion:</p>
                  <img src={`http://localhost:5000${req.assignment.after_image}`} alt="Proof" style={{maxHeight:'150px', borderRadius:'8px', border:'2px solid var(--success)'}} />
                </div>
              )}

              {req.assignment?.staff && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <strong>Assigned to:</strong> {req.assignment.staff.user.name}
                </div>
              )}

              {req.status === 'COMPLETED' && (
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                    <span style={{color:'var(--text-muted)'}}>Time Taken:</span>
                    <strong>{getTimeTaken(req.created_at, req.completed_at)}</strong>
                  </div>
                  {getSlaDelay(req.created_at, req.completed_at) > 0 && (
                    <div style={{display:'flex', justifyContent:'space-between', color:'var(--danger)'}}>
                      <span>SLA Breach Delay:</span>
                      <strong>{getSlaDelay(req.created_at, req.completed_at)} hours</strong>
                    </div>
                  )}
                </div>
              )}

              {req.status === 'COMPLETED' && !req.feedback && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <p style={{ marginBottom: '8px', fontWeight: 600 }}>Leave Feedback</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => submitFeedback(req.id, star, 'Looks good')} style={{ background: 'transparent', border: '1px solid var(--primary)', borderRadius: '4px', color: 'var(--primary)', padding: '4px 8px', cursor: 'pointer' }}>
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {req.feedback && (
                <div style={{ marginTop: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Rated {req.feedback.rating} Stars
                </div>
              )}

              {req.status === 'RESOLVED' && (
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem', width: '100%', background: 'var(--success)' }}
                  onClick={() => handleConfirm(req.id)}
                >
                  Confirm Completion
                </button>
              )}

              {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && req.status !== 'RESOLVED' && (
                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1rem', width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={() => handleCancel(req.id)}
                >
                  Cancel Request
                </button>
              )}

              {(req.status === 'RESOLVED' || req.status === 'CANCELLED') && (
                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1rem', width: '100%', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  onClick={() => handleReopen(req.id)}
                >
                  Reopen Request
                </button>
              )}
            </div>
          ))}
          {requests.length === 0 && <p>No requests found. You're all caught up!</p>}
        </div>
      </div>
    </>
  );
}
