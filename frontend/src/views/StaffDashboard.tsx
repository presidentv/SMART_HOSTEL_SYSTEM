import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../context/AuthContext';
import { format } from 'date-fns';

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [proofs, setProofs] = useState<{ [key: number]: File | null }>({});

  const fetchTasks = async () => {
    try {
      const res = await api.get('/requests');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      if (status === 'RESOLVED') {
        const file = proofs[id];
        if (!file) {
          alert("Please upload a proof of completion photo to resolve this task.");
          return;
        }
        const fd = new FormData();
        fd.append('status', status);
        fd.append('after_image', file);
        await api.put(`/requests/${id}/status`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.put(`/requests/${id}/status`, { status });
      }
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h2>Assigned Tasks</h2>
          <p>Please update task status as you progress.</p>
        </div>

        <div className="grid grid-cols-3">
          {tasks
            .sort((a, b) => {
              const priorityOrder = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
              return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
            })
            .map((task) => (
            <div key={task.id} className="glass-panel" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              borderLeft: task.priority === 'URGENT' ? '4px solid var(--danger)' : undefined, 
              background: task.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.05)' : undefined,
              boxShadow: task.priority === 'URGENT' ? '0 0 20px rgba(239, 68, 68, 0.15)' : undefined 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status.replace('_', ' ')}</span>
                {task.priority === 'URGENT' && <span className="badge" style={{ background: 'var(--danger)', color: 'white', fontWeight: 800 }}>URGENT</span>}
                {task.priority === 'HIGH' && <span className="badge" style={{ background: 'var(--warning)', color: 'white' }}>HIGH</span>}
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{task.category}</h3>
              <div style={{ margin: '0.5rem 0', fontWeight: 600, color: 'var(--text-main)' }}>Room: {task.room}</div>
              <p style={{ flex: 1, marginBottom: '0.5rem' }}>{task.description}</p>
              
              {task.image_url && (
                <img src={task.image_url} alt="Issue" style={{maxHeight:'100px', borderRadius:'8px', marginBottom:'1rem', alignSelf:'flex-start'}} />
              )}

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Requested by: {task.user.name}<br/>
                Time: {format(new Date(task.created_at), 'MMM dd, HH:mm')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                {task.status === 'ASSIGNED' && (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => updateStatus(task.id, 'IN_PROGRESS')}>
                    Start Work
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <input type="file" className="form-control" accept="image/*" onChange={e => setProofs({...proofs, [task.id]: e.target.files ? e.target.files[0] : null})} />
                    <button className="btn btn-primary" style={{ width: '100%', background: 'var(--success)' }} onClick={() => updateStatus(task.id, 'RESOLVED')}>
                      Upload Proof & Resolve
                    </button>
                  </div>
                )}
                {task.status === 'RESOLVED' && (
                  <div style={{ color: 'var(--primary)', fontWeight: 600, textAlign: 'center', width: '100%' }}>Pending Student Confirmation</div>
                )}
                {task.status === 'COMPLETED' && (
                  <div style={{ color: 'var(--success)', fontWeight: 600, textAlign: 'center', width: '100%' }}>Task Completed</div>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p>No assigned tasks. Have a rest!</p>}
        </div>
      </div>
    </>
  );
}
