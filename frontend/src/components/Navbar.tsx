import React from 'react';
import { useAuth, api } from '../context/AuthContext';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) { console.error(err) }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      fetchNotifications();
    } catch (err) {}
  };

  return (
    <nav className="glass-nav">
      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>Smart Hostel</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', position: 'relative', marginTop:'6px' }}>
            <Bell size={20} />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="glass-panel" style={{ position: 'absolute', right: 0, top: '40px', width: '320px', zIndex: 1000, padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Notifications</h4>
                {notifications.some(n => !n.is_read) && (
                  <button onClick={markAllAsRead} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>Mark all read</button>
                )}
              </div>
              {notifications.length === 0 ? <p style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>No notifications.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} style={{ padding: '8px', background: n.is_read ? 'transparent' : 'rgba(111, 28, 244, 0.1)', borderLeft: n.is_read ? '2px solid transparent' : '2px solid var(--primary)', borderRadius: '4px', cursor: n.is_read ? 'default' : 'pointer', fontSize: '0.85rem', color: n.is_read ? 'var(--text-muted)' : 'var(--text-main)' }}>
                      <div>{n.message}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{format(new Date(n.created_at), 'MMM dd, HH:mm')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
            <UserIcon size={16} />
            <span>{user?.name} ({user?.role})</span>
          </a>
        </div>
        
        <button 
          onClick={logout}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--danger)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
}
