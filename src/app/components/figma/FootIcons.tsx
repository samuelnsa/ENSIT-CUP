/**
 * FootIcons — icônes SVG football partagées, cohérentes avec la page Login.
 * Zéro dépendance externe.
 */

export const BallSVG = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <polygon points="32,8 40,16 37,26 27,26 24,16" fill="currentColor" opacity="0.9" />
    <polygon points="8,24 18,20 24,28 19,38 9,36" fill="currentColor" opacity="0.7" />
    <polygon points="56,24 46,20 40,28 45,38 55,36" fill="currentColor" opacity="0.7" />
    <polygon points="14,50 22,42 32,46 32,56 20,58" fill="currentColor" opacity="0.7" />
    <polygon points="50,50 42,42 32,46 32,56 44,58" fill="currentColor" opacity="0.7" />
  </svg>
);

export const TrophySVG = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8h24v20c0 11-12 16-12 16S20 39 20 28V8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M20 14H10c0 10 6 14 10 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M44 14h10c0 10-6 14-10 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <line x1="32" y1="44" x2="32" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="22" y="52" width="20" height="4" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M28 22l2 4 4 0.5-3 3 0.7 4-3.7-2-3.7 2 0.7-4-3-3 4-0.5z" fill="currentColor" opacity="0.8"/>
  </svg>
);

export const ShirtSVG = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6l-14 10 6 8 6-4v34h28V20l6 4 6-8-14-10c-2 4-6 6-12 6s-10-2-12-6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M26 6c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

export const WhistleSVG = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="40" r="16" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M34 28L50 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M44 8l8 8-6 2-4-4z" fill="currentColor" opacity="0.8"/>
    <circle cx="22" cy="40" r="6" fill="currentColor" opacity="0.3"/>
    <line x1="10" y1="40" x2="16" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="22" y1="28" x2="22" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const BootSVG = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20v22c0 4 3 6 6 6h32l4-8H28V20H10z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M28 20V10c0-2 2-4 4-4h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <line x1="10" y1="34" x2="28" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M46 42l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 46l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const StarSVG = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2l3.6 7.3 8 1.2-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8L4.4 10.5l8-1.2z"/>
  </svg>
);

export const FieldLineSVG = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 800 520" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="40" width="720" height="440" rx="4" stroke="white" strokeWidth="3"/>
    <line x1="400" y1="40" x2="400" y2="480" stroke="white" strokeWidth="3"/>
    <circle cx="400" cy="260" r="80" stroke="white" strokeWidth="3"/>
    <circle cx="400" cy="260" r="5" fill="white"/>
    <rect x="40" y="160" width="120" height="200" stroke="white" strokeWidth="3"/>
    <rect x="40" y="210" width="50" height="100" stroke="white" strokeWidth="3"/>
    <rect x="640" y="160" width="120" height="200" stroke="white" strokeWidth="3"/>
    <rect x="710" y="210" width="50" height="100" stroke="white" strokeWidth="3"/>
    <path d="M160 180 Q200 260 160 340" stroke="white" strokeWidth="3" fill="none"/>
    <path d="M640 180 Q600 260 640 340" stroke="white" strokeWidth="3" fill="none"/>
    <rect x="10" y="220" width="32" height="80" stroke="white" strokeWidth="2.5"/>
    <rect x="758" y="220" width="32" height="80" stroke="white" strokeWidth="2.5"/>
    <circle cx="130" cy="260" r="4" fill="white"/>
    <circle cx="670" cy="260" r="4" fill="white"/>
  </svg>
);
