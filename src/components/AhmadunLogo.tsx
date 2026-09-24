import React from 'react';

interface AhmadunLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'badge' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const AhmadunLogo: React.FC<AhmadunLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
  showSubtitle = true
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', title: 'text-sm font-bold', sub: 'text-[10px]' },
    md: { icon: 'w-10 h-10', title: 'text-base font-extrabold', sub: 'text-[11px]' },
    lg: { icon: 'w-14 h-14', title: 'text-xl font-black', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', title: 'text-2xl font-black', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'icon') {
    return (
      <div className={`relative shrink-0 rounded-xl overflow-hidden bg-white shadow-xs border border-emerald-100 flex items-center justify-center ${currentSize.icon} ${className}`}>
        <img
          src="/logo.png"
          alt="Ahmadun Agro Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            // Fallback to SVG if PNG has any issue
            (e.currentTarget as HTMLImageElement).src = '/logo.svg';
          }}
        />
      </div>
    );
  }

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emblem / Logo Icon */}
      <div className={`relative shrink-0 rounded-xl overflow-hidden bg-white shadow-xs border ${isLight ? 'border-white/20' : 'border-emerald-100'} flex items-center justify-center ${currentSize.icon}`}>
        <img
          src="/logo.png"
          alt="Ahmadun Agro Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/logo.svg';
          }}
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-tight select-none">
        <div className="flex items-baseline gap-1.5">
          <span className={`tracking-tight ${currentSize.title} ${isLight ? 'text-white' : 'text-emerald-950 font-bold'}`}>
            Ahmadun Agro
          </span>
        </div>
        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-px w-3 ${isLight ? 'bg-emerald-300/40' : 'bg-emerald-600/40'}`} />
            <span className={`font-semibold tracking-wide ${currentSize.sub} ${isLight ? 'text-emerald-200' : 'text-emerald-700'}`}>
              আহমাদুন এগ্রো
            </span>
            <span className={`h-px w-3 ${isLight ? 'bg-emerald-300/40' : 'bg-emerald-600/40'}`} />
          </div>
        )}
      </div>
    </div>
  );
};
