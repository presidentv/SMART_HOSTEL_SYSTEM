import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Placeholders for views
const LoginView = React.lazy(() => import('./views/LoginView'));
const StudentDashboard = React.lazy(() => import('./views/StudentDashboard'));
const StaffDashboard = React.lazy(() => import('./views/StaffDashboard'));
const AdminDashboard = React.lazy(() => import('./views/AdminDashboard'));
const ProfileView = React.lazy(() => import('./views/ProfileView'));

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const RoleBasedRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  switch(user.role) {
    case 'STUDENT': return <Navigate to="/student" replace />;
    case 'STAFF': return <Navigate to="/staff" replace />;
    case 'ADMIN': return <Navigate to="/admin" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={<div className="container">Loading application...</div>}>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/" element={<RoleBasedRouter />} />
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/staff/*" element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileView />
              </ProtectedRoute>
            } />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
