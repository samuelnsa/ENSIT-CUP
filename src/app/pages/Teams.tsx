import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Users } from 'lucide-react';
import { useÉquipes } from '../hooks/useSupabase';

export const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { équipes, chargement, erreur } = useÉquipes();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full stripe-purple" />
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Équipes inscrites</h1>
            <p className="text-sm text-muted">Découvrez les équipes qui s'affrontent pour l'ENSIT Cup.</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/admin?tab=teams#create-team-form')} className="btn-primary w-fit py-2.5 px-4 text-sm font-semibold">
            + Inscrire une équipe
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {chargement ? (
          <div className="col-span-full text-center py-12 text-sm text-muted">Chargement des équipes...</div>
        ) : erreur ? (
          <div className="col-span-full text-center text-red-400 py-12 text-sm">{erreur}</div>
        ) : équipes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-sm text-muted">Aucune équipe disponible pour le moment.</div>
        ) : (
          équipes.map(team => (
            <div 
              key={team.id} 
              onClick={() => navigate(`/teams/${team.id}`)}
              className="glass card-3d overflow-hidden cursor-pointer flex flex-col"
            >
              <div className="h-32 w-full relative bg-panel-lighter">
                <ImageWithFallback src={team.logo} alt={team.nom} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3 font-display font-bold text-lg text-primary">
                  {team.nom}
                </div>
              </div>
              <div className="p-4 flex items-center justify-between mt-auto border-t border-panel">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-panel-success text-accent-strong">
                  Classe {team.classe}
                </span>
                <div className="flex items-center text-sm gap-1.5 font-medium transition-all text-muted">
                  <Users className="w-4 h-4" />
                  <span>Détails</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
