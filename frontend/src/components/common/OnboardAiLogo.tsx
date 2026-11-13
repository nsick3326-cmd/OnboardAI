import React from 'react';

interface OnboardAiIconProps {
  size?: number;
  className?: string;
  variant?: 'badge' | 'glyph';
  theme?: 'dark' | 'light';
}

/**
 * OnboardAI Enterprise Brand Icon
 * 
 * Concept:
 * - Two interlocking, ascending geometric loops representing employee and organization connecting
 * - High-contrast vibrant violet (#7655F7) and crisp white (#FFFFFF) ribbons
 * - Apex growth chevron and base connection node in bright teal (#18B89A)
 * - Guaranteed 100% contrast on both dark and light backgrounds
 */
export const OnboardAiIcon: React.FC<OnboardAiIconProps> = ({
  size = 38,
  className = '',
  variant = 'badge',
  theme = 'dark',
}) => {
  const isGlyphOnly = variant === 'glyph';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="OnboardAI Logo Symbol"
    >
      <defs>
        {/* Primary violet gradient */}
        <linearGradient id="oai-grad-violet" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8A6DF9" />
          <stop offset="100%" stopColor="#6039EB" />
        </linearGradient>

        {/* Deep indigo badge background */}
        <linearGradient id="oai-grad-badge" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#251E50" />
          <stop offset="100%" stopColor="#140F2D" />
        </linearGradient>

        {/* Teal growth accent */}
        <linearGradient id="oai-grad-teal" x1="18" y1="6" x2="30" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Rounded container badge when variant === 'badge' */}
      {!isGlyphOnly && (
        <>
          <rect width="48" height="48" rx="13" fill="url(#oai-grad-badge)" />
          {/* Subtle inner highlight border */}
          <rect
            x="0.75"
            y="0.75"
            width="46.5"
            height="46.5"
            rx="12.25"
            stroke="white"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
          {/* Ambient radial violet glow */}
          <circle cx="16" cy="14" r="14" fill="#7655F7" fillOpacity="0.3" />
        </>
      )}

      {/* Geometric Glyph */}
      <g>
        {/* Left Ribbon: Employee arrival & ascending journey (Violet) */}
        <path
          d="M14 34 C14 26, 19 23, 24 23 C19 19, 16 16, 16 13 C16 9.5, 19.5 7.5, 24 7.5"
          stroke="url(#oai-grad-violet)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Ribbon: Organization embracing & guiding (Pure White on dark, Deep Indigo on light) */}
        <path
          d="M34 34 C34 26, 29 23, 24 23 C29 19, 32 16, 32 13 C32 9.5, 28.5 7.5, 24 7.5"
          stroke={isGlyphOnly && theme === 'light' ? '#211B45' : '#FFFFFF'}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={isGlyphOnly && theme === 'light' ? 1 : 0.95}
        />

        {/* Left Connection Node (Violet figure head) */}
        <circle
          cx="17"
          cy="13"
          r="2.8"
          fill="#A18BFF"
        />

        {/* Right Connection Node (White figure head) */}
        <circle
          cx="31"
          cy="13"
          r="2.8"
          fill={isGlyphOnly && theme === 'light' ? '#211B45' : '#FFFFFF'}
        />

        {/* Upward Apex Milestone Node (Bright Teal) */}
        <circle
          cx="24"
          cy="7.5"
          r="3.2"
          fill="url(#oai-grad-teal)"
        />

        {/* Foundation Base Connector (Teal) */}
        <path
          d="M19 34 H29"
          stroke="url(#oai-grad-teal)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

interface OnboardAiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  variant?: 'badge' | 'glyph';
  subtitle?: string;
}

export const OnboardAiLogo: React.FC<OnboardAiLogoProps> = ({
  size = 'md',
  showLabel = true,
  theme = 'light',
  className = '',
  variant = 'badge',
  subtitle,
}) => {
  const sizeMap = {
    sm: { icon: 30, text: 'text-base', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { icon: 38, text: 'text-lg', badge: 'text-[10px] px-2 py-0.5' },
    lg: { icon: 46, text: 'text-2xl', badge: 'text-[11px] px-2.5 py-0.5' },
  };

  const { icon, text, badge } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <OnboardAiIcon size={icon} variant={variant} theme={theme} />

      {showLabel && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold tracking-tight ${text} ${
                theme === 'dark' ? 'text-white' : 'text-[#17182B]'
              }`}
            >
              Onboard<span className="text-[#8B6DF9]">AI</span>
            </span>
            <span
              className={`font-semibold tracking-wider uppercase rounded-full border ${badge} ${
                theme === 'dark'
                  ? 'bg-violet-500/20 text-violet-300 border-violet-400/30'
                  : 'bg-violet-50 text-[#7655F7] border-violet-200/80'
              }`}
            >
              ENTERPRISE
            </span>
          </div>
          {subtitle && (
            <span className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-[#727A91]'}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardAiLogo;
