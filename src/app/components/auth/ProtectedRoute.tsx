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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role as any)) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Accès refusé</h1>
          <p className="text-slate-600 mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
