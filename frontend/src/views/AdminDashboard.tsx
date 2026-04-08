import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../context/AuthContext';
import { Users, AlertCircle, CheckCircle, ClipboardList, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [roomStats, setRoomStats] = useState<any[]>([]);
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS'>('OVERVIEW');

  const fetchStats = async () => {
    try {
      const [resStats, resDaily, resRooms, resPending, resUsers] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics/daily'),
        api.get('/admin/analytics/rooms'),
        api.get('/admin/pending-staff'),
        api.get('/admin/users')
      ]);
      setStats(resStats.data);
      setDailyStats(resDaily.data);
      setRoomStats(resRooms.data);
      setPendingStaff(resPending.data);
      setAllUsers(resUsers.data);
    } catch (err) {
      console.error(err);
    }
  };

  const approveStaff = async (id: number) => {
    try {
      await api.put(`/admin/approve-staff/${id}`);
      fetchStats();
    } catch(err) { console.error(err) }
  };

  const rejectStaff = async (id: number) => {
    if (window.confirm('Reject this staff application?')) {
      try {
        await api.delete(`/admin/reject-staff/${id}`);
        fetchStats();
      } catch(err) { console.error(err) }
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return <div className="container">Loading stats...</div>;

  return (
    <>
      <Navbar />
      <div className="container">
        <h2 style={{ marginBottom: '2rem' }}>Warden Dashboard</h2>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('OVERVIEW')} className={`btn ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'}`}>Overview</button>
          <button onClick={() => setActiveTab('USERS')} className={`btn ${activeTab === 'USERS' ? 'btn-primary' : 'btn-secondary'}`}>All Database Users</button>
        </div>

        {activeTab === 'OVERVIEW' && (
          <>
        {/* Overview Stats */}
        <div className="grid grid-cols-4" style={{ marginBottom: '3rem' }}>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <ClipboardList size={32} color="var(--primary)" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.totalRequests}</div>
            <p>Total Requests</p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <AlertCircle size={32} color="var(--warning)" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.pendingRequests}</div>
            <p>Active Tasks</p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <AlertCircle size={32} color="var(--danger)" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.urgentRequests + stats.slaBreached}</div>
            <p>Urgent / SLA Breached</p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.completedRequests}</div>
            <p>Completed Tasks</p>
          </div>
        </div>

        {pendingStaff.length > 0 && (
          <div className="glass-panel" style={{ marginBottom: '2rem', border: '1px solid var(--warning)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>Pending Staff Approvals ({pendingStaff.length})</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 0' }}>Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStaff.map(staff => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 0' }}>{staff.name}</td>
                    <td>{staff.email}</td>
                    <td>{staff.staffProfile?.specialization}</td>
                    <td>
                      <div style={{display:'flex', gap:'8px'}}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', background: 'var(--success)' }} onClick={() => approveStaff(staff.id)}>
                          Approve
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => rejectStaff(staff.id)}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-2">
          {/* Staff Workload */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Staff Workload
            </h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 0' }}>Trade Focus</th>
                  <th>Staff Name</th>
                  <th>Availability</th>
                  <th>Tasks Handled</th>
                  <th>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {stats.staffWorkload.sort((a: any, b: any) => a.specialization.localeCompare(b.specialization)).map((staff: any) => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 0', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>{staff.specialization}</td>
                    <td style={{ padding: '12px 0', fontWeight: 500 }}>{staff.user.name}</td>
                    <td>
                      <span className={`badge ${staff.is_available ? 'badge-completed' : 'badge-pending'}`}>
                        {staff.is_available ? 'Available' : 'Busy'}
                      </span>
                    </td>
                    <td>{staff.tasks_handled}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="var(--warning)" />
                        {staff.avg_rating > 0 ? staff.avg_rating : 'New'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category Stats */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Issues By Category</h3>
            <ResponsiveContainer width="100%" height="80%" minHeight={250}>
              <BarChart data={stats.categoryStats.map((c: any) => ({ name: c.category, count: c._count.id }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--glass-bg)', border: 'none', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
          {/* Daily Trend Chart */}
          <div className="glass-panel" style={{ height: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Requests Over Time</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--glass-bg)', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--success)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Problematic Rooms View */}
          <div className="glass-panel" style={{ height: '400px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Most Problematic Rooms</h3>
            {roomStats.length === 0 ? <p style={{color: 'var(--text-muted)'}}>No issues reported recently.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roomStats.map((room, idx) => (
                  <div key={room.room} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, marginRight: '16px', fontSize: '1.2rem', color: idx < 3 ? 'var(--danger)' : 'var(--text-muted)' }}>#{idx + 1}</span>
                      <strong style={{ fontSize: '1.1rem' }}>{room.room}</strong>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', background: 'rgba(111, 28, 244, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                      {room._count.id} Issues
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {activeTab === 'USERS' && (
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> System Users Record
            </h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 0' }}>Role</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 0' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-urgent' : u.role === 'STAFF' ? 'badge-completed' : 'badge-pending'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.room_number || '-'}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
