import React, { useState } from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subtext?: string;
  lightText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 44,
  showText = false,
  subtext = 'Berkarakter • Berprestasi • Maju',
  lightText = false,
}) => {
  // Official SMP Negeri 2 Pulung logo (emblem with star, songsong/payung Pulung, golden wings, open book, and lotus border)
  const PRIMARY_LOGO_URL = '/assets/logo_smpn2_pulung.png';
  const DRIVE_LOGO_URL = 'https://lh3.googleusercontent.com/d/1oNzBQ65aUoWPJdLS7WzMBiQgmvCHkDEP';

  const [hasError, setHasError] = useState(false);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official School Emblem Container */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-all select-none"
        style={{ width: size, height: size }}
      >
        {!hasError ? (
          <img
            src={PRIMARY_LOGO_URL}
            alt="Logo SMP Negeri 2 Pulung"
            onError={() => {
              // If local asset somehow fails, try Google Drive or fallback
              setHasError(true);
            }}
            className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-150 hover:scale-105"
          />
        ) : (
          <img
            src={DRIVE_LOGO_URL}
            alt="Logo SMP Negeri 2 Pulung"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight text-base leading-tight ${
              lightText ? 'text-white' : 'text-slate-900'
            }`}
          >
            SMP Negeri 2 Pulung
          </span>
          {subtext && (
            <span
              className={`text-xs ${
                lightText ? 'text-sky-200' : 'text-slate-500'
              }`}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
