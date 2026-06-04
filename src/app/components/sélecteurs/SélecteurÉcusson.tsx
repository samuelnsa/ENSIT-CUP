import React from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { écussonsDisponibles } from '../../donnees/écussons';

interface SélecteurÉcussonProps {
  écussonSélectionné: string;
  onÉcussonChange: (écussonId: string) => void;
}

export const SélecteurÉcusson: React.FC<SélecteurÉcussonProps> = ({
  écussonSélectionné,
  onÉcussonChange,
}) => {
  return (
    <div className="w-full space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
        Écusson de l'équipe
      </label>
      
      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3 p-4 rounded-xl bg-panel-soft border-panel">
        {écussonsDisponibles.map((écusson) => (
          <button
            type="button"
            key={écusson.id}
            onClick={() => onÉcussonChange(écusson.id)}
            className={`relative group rounded-lg overflow-hidden transition-all duration-200 p-2 flex items-center justify-center ${écussonSélectionné === écusson.id ? 'selected-écusson' : 'panel-ultra-soft border-panel'}`}
            title={écusson.nom}
          >
            <ImageWithFallback
              src={écusson.url}
              alt={écusson.nom}
              className="w-10 h-10 object-contain rounded"
            />
            {écussonSélectionné === écusson.id && (
              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full dot-accent" />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[9px] font-semibold py-0.5 text-center opacity-0 group-hover:opacity-100 transition-all">
              {écusson.nom}
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs p-3 rounded-lg flex items-center gap-2 bg-panel-success border-panel text-muted">
        <span>ℹ️</span>
        <span>Vous pouvez modifier l'écusson plus tard dans les paramètres de l'équipe.</span>
      </div>
    </div>
  );
};
