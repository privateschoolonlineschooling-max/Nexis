import React, { useState } from 'react';
import { BadgeCheck, ShieldAlert } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'user' | 'community' | 'organization';
  showTooltip?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  type = 'user',
  showTooltip = true,
  className = ''
}) => {
  const [hovered, setHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const isGold = type === 'organization';
  const badgeColor = isGold ? 'text-amber-500 fill-amber-500/20' : 'text-blue-500 fill-blue-500/20';

  return (
    <span
      className={`relative inline-flex items-center justify-center align-middle ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      id="verified-badge-container"
    >
      <BadgeCheck
        className={`${sizeClasses[size]} ${badgeColor} inline-block transition-transform hover:scale-110`}
        aria-label="Verified Account"
      />

      {showTooltip && hovered && (
        <div
          id="verified-badge-tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 bg-neutral-900 text-neutral-100 text-xs rounded-xl shadow-2xl border border-neutral-800 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1">
            <BadgeCheck className="w-4 h-4 text-blue-400" />
            <span>Verified Authenticity</span>
          </div>
          <p className="text-neutral-300 leading-relaxed">
            This badge confirms that Nexis has verified the authentic identity or legitimate status of this account.
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-neutral-800 flex items-start gap-1 text-[10px] text-neutral-400 leading-tight">
            <ShieldAlert className="w-3 h-3 text-neutral-500 shrink-0 mt-0.5" />
            <span>Does not represent financial endorsement or guarantee of external transactions.</span>
          </div>
        </div>
      )}
    </span>
  );
};
