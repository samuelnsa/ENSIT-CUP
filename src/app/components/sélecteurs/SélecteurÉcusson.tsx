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

      {/* Grille 2 colonnes sur mobile, 5 sur tablette, 5 sur desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3 rounded-xl bg-panel-soft border-panel">
        {écussonsDisponibles.map((écusson) => {
          const isSelected = écussonSélectionné === écusson.id;
          return (
            <button
              type="button"
              key={écusson.id}
              onClick={() => onÉcussonChange(écusson.id)}
              className={`relative group rounded-xl overflow-hidden transition-all duration-200 p-3 flex flex-col items-center justify-center gap-2 min-h-[100px] ${
                isSelected
                  ? 'ring-2 ring-emerald-500 bg-emerald-500/10 selected-écusson'
                  : 'hover:bg-white/5 panel-ultra-soft border-panel'
              }`}
              title={écusson.nom}
              aria-label={écusson.nom}
              aria-pressed={isSelected}
            >
              {/* Badge agrandi — 20x20 sur mobile (80px), 18x18 sur desktop */}
              <ImageWithFallback
                src={écusson.url}
                alt={écusson.nom}
                className="w-20 h-20 sm:w-16 sm:h-16 object-contain rounded-xl drop-shadow-md"
              />
              {/* Nom du club toujours visible sur mobile */}
              <span className="text-[11px] sm:text-[10px] font-semibold text-center leading-tight text-white/80 line-clamp-2 w-full">
                {écusson.nom}
              </span>
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full dot-accent shadow-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Aperçu de l'écusson sélectionné */}
      {écussonSélectionné && (() => {
        const selected = écussonsDisponibles.find(e => e.id === écussonSélectionné);
        return selected ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-panel-success border-panel">
            <ImageWithFallback
              src={selected.url}
              alt={selected.nom}
              className="w-12 h-12 object-contain rounded-lg"
            />
            <div>
              <p className="text-xs font-semibold text-primary">Sélectionné : {selected.nom}</p>
              <p className="text-[10px] text-muted mt-0.5">Modifiable ultérieurement.</p>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
};
