import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'captain')[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent-strong" />
          <p className="text-sm text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role as any)) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="glass rounded-3xl p-10 text-center border-panel max-w-md w-full animate-slide-up">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <Loader2 className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-primary mb-3">Accès refusé</h1>
          <p className="text-muted mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="btn-primary max-w-xs mx-auto"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
