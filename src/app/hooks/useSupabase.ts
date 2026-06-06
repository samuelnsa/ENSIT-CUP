import { useEffect, useState } from 'react';
import { obtenirToutesLesÉquipes, obtenirÉquipeParId, Équipe } from '../services/équipesService';
import { obtenirJoueursÉquipe as obtenirJoueurs, obtenirTousLesJoueurs, Joueur } from '../services/joueursService';
import {
  obtenirTousLesMatchs,
  obtenirMatchParId,
  obtenirMatchsÀVenir,
  obtenirMatchsTerminés,
  obtenirMatchsÉquipe,
  Match,
} from '../services/matchsService';

// Clé de cache partagée — à invalider après toute mutation admin
export const CACHE_KEY_ÉQUIPES = 'ensit_cup_equipes_cache';

/** Vide le cache localStorage des équipes pour forcer un rechargement depuis Supabase */
export function invalidateCacheÉquipes() {
  try {
    localStorage.removeItem(CACHE_KEY_ÉQUIPES);
  } catch (_) {
    // localStorage peut être indisponible en navigation privée
  }
}

interface ÉtatÉquipes {
  équipes: Équipe[];
  chargement: boolean;
  erreur: string | null;
  refetch: () => Promise<void>;
}

export const useÉquipes = (): ÉtatÉquipes => {
  const [équipes, setÉquipes] = useState<Équipe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerÉquipes = async () => {
    try {
      setChargement(true);
      const données = await obtenirToutesLesÉquipes();
      setÉquipes(données);
      // Mettre à jour le cache avec les données fraîches
      try {
        localStorage.setItem(CACHE_KEY_ÉQUIPES, JSON.stringify(données));
      } catch (_) {}
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des équipes');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    // Afficher immédiatement depuis le cache si disponible
    try {
      const cached = localStorage.getItem(CACHE_KEY_ÉQUIPES);
      if (cached) {
        const parsed = JSON.parse(cached) as Équipe[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setÉquipes(parsed);
          setErreur(null);
        }
      }
    } catch (err) {
      console.warn('Cache équipes invalide :', err);
    }
    // Toujours rafraîchir depuis Supabase au montage
    chargerÉquipes();
  }, []);

  return { équipes, chargement, erreur, refetch: chargerÉquipes };
};

export const useAdminÉquipes = (): ÉtatÉquipes => {
  const [équipes, setÉquipes] = useState<Équipe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerÉquipes = async () => {
    try {
      setChargement(true);
      const données = await obtenirToutesLesÉquipes(true);
      setÉquipes(données);
      // Invalider le cache public pour que les autres vues reflètent les changements admin
      invalidateCacheÉquipes();
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des équipes admin');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    // Invalider le cache au montage de l'admin pour forcer des données fraîches
    invalidateCacheÉquipes();
    chargerÉquipes();
  }, []);

  return { équipes, chargement, erreur, refetch: chargerÉquipes };
};

interface ÉtatJoueurs {
  joueurs: Joueur[];
  chargement: boolean;
  erreur: string | null;
  refetch: () => Promise<void>;
}

export const useJoueurs = (idÉquipe: string): ÉtatJoueurs => {
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerJoueurs = async () => {
    if (!idÉquipe) return;
    try {
      setChargement(true);
      const données = await obtenirJoueurs(idÉquipe);
      setJoueurs(données);
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des joueurs');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (!idÉquipe) {
      setJoueurs([]);
      setErreur(null);
      setChargement(false);
      return;
    }
    chargerJoueurs();
  }, [idÉquipe]);

  return { joueurs, chargement, erreur, refetch: chargerJoueurs };
};

export const useTousLesJoueurs = (): ÉtatJoueurs => {
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerJoueurs = async () => {
    try {
      setChargement(true);
      const données = await obtenirTousLesJoueurs();
      setJoueurs(données);
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des joueurs');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerJoueurs();
  }, []);

  return { joueurs, chargement, erreur, refetch: chargerJoueurs };
};

interface ÉtatMatchs {
  matchs: Match[];
  chargement: boolean;
  erreur: string | null;
  refetch: () => Promise<void>;
}

export const useMatchs = (): ÉtatMatchs => {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerMatchs = async () => {
    try {
      setChargement(true);
      const données = await obtenirTousLesMatchs();
      setMatchs(données);
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des matchs');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerMatchs();
  }, []);

  return { matchs, chargement, erreur, refetch: chargerMatchs };
};

export const useMatchsÀVenir = (): ÉtatMatchs => {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerMatchs = async () => {
    try {
      setChargement(true);
      const données = await obtenirMatchsÀVenir();
      setMatchs(données);
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des matchs à venir');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerMatchs();
  }, []);

  return { matchs, chargement, erreur, refetch: chargerMatchs };
};

export const useMatchsTerminés = (): ÉtatMatchs => {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerMatchs = async () => {
    try {
      setChargement(true);
      const données = await obtenirMatchsTerminés();
      setMatchs(données);
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des matchs terminés');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerMatchs();
  }, []);

  return { matchs, chargement, erreur, refetch: chargerMatchs };
};

export const useMatchsÉquipe = (idÉquipe: string): ÉtatMatchs => {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerMatchs = async () => {
    if (!idÉquipe) return;
    try {
      setChargement(true);
      const données = await obtenirMatchsÉquipe(idÉquipe);
      setMatchs(données);
      setErreur(null);
    } catch (err) {
      setErreur('Erreur lors du chargement des matchs de l\'équipe');
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (!idÉquipe) {
      setMatchs([]);
      setErreur(null);
      setChargement(false);
      return;
    }
    chargerMatchs();
  }, [idÉquipe]);

  return { matchs, chargement, erreur, refetch: chargerMatchs };
};

export const useMatch = (idMatch: string): { match: Match | null; chargement: boolean; erreur: string | null } => {
  const [match, setMatch] = useState<Match | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!idMatch) {
      setMatch(null);
      setErreur(null);
      setChargement(false);
      return;
    }

    const chargerMatch = async () => {
      try {
        setChargement(true);
        const donnée = await obtenirMatchParId(idMatch);
        setMatch(donnée);
        setErreur(null);
      } catch (err) {
        setErreur('Erreur lors du chargement du match');
        console.error(err);
      } finally {
        setChargement(false);
      }
    };

    chargerMatch();
  }, [idMatch]);

  return { match, chargement, erreur };
};

export const useÉquipe = (idÉquipe: string): { équipe: Équipe | null; chargement: boolean; erreur: string | null } => {
  const [équipe, setÉquipe] = useState<Équipe | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!idÉquipe) {
      setÉquipe(null);
      setErreur(null);
      setChargement(false);
      return;
    }

    const chargerÉquipe = async () => {
      try {
        setChargement(true);
        const donnée = await obtenirÉquipeParId(idÉquipe);
        setÉquipe(donnée);
        setErreur(null);
      } catch (err) {
        setErreur('Erreur lors du chargement de l\'équipe');
        console.error(err);
      } finally {
        setChargement(false);
      }
    };

    chargerÉquipe();
  }, [idÉquipe]);

  return { équipe, chargement, erreur };
};
