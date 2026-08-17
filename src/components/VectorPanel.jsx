import { useId } from 'react';

const PANEL_STROKES = {
  cyan: '#00F1DE',
  bone: '#F7F5F0',
};

const PANEL_FILLS = {
  cyan: 'rgba(0, 241, 222, 0.06)',
  bone: 'rgba(247, 245, 240, 0.04)',
};

export default function VectorPanel({
  variant = 'cyan',
  className = '',
  children,
}) {
  const reactId = useId();
  const clipId = `vp-clip-${variant}-${reactId.replace(/:/g, '')}`;
  const accentId = `vp-accent-${variant}-${reactId.replace(/:/g, '')}`;

  const stroke = PANEL_STROKES[variant] || PANEL_STROKES.cyan;
  const fill = PANEL_FILLS[variant] || PANEL_FILLS.cyan;

  return (
    <div className={`relative ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path
              d="M 0.06 0 L 1 0 L 1 1 L 0 1 L 0 0.7 C 0.22 0.64 0.38 0.36 0.6 0.3 Z"
            />
          </clipPath>
          <linearGradient id={accentId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.0" />
            <stop offset="50%" stopColor={stroke} stopOpacity="0.45" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width="100" height="100" fill="rgba(9, 9, 9, 0.92)" />
          <rect x="0" y="0" width="100" height="100" fill={fill} />
          <path
            d="M 0 70 C 22 64 38 36 60 30"
            fill="none"
            stroke={`url(#${accentId})`}
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 100 70 C 78 64 62 36 40 30"
            fill="none"
            stroke={`url(#${accentId})`}
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        <path
          d="M 0.06 0 L 1 0 L 1 1 L 0 1 L 0 0.7 C 0.22 0.64 0.38 0.36 0.6 0.3"
          fill="none"
          stroke={stroke}
          strokeWidth="0.18"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 0.94 0 L 0.94 0.7 C 0.78 0.64 0.62 0.36 0.4 0.3"
          fill="none"
          stroke={stroke}
          strokeWidth="0.18"
          vectorEffect="non-scaling-stroke"
          opacity="0.55"
        />
      </svg>

      <div className="relative z-10 p-6 md:p-8 h-full">{children}</div>
    </div>
  );
}
