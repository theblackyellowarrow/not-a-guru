import { useId, useMemo } from 'react';

const PARTICLES_PER_RING = 12;
const INNER_RADIUS = 78;
const OUTER_RADIUS = 132;
const VIEWBOX = 320;

function buildRing(radius, count) {
  return Array.from({ length: count }, (_, index) => ({
    angle: (index / count) * Math.PI * 2,
    radius,
    speed: 1 + (index % 3) * 0.18,
    size: 1.6 + ((index * 7) % 5) * 0.4,
  }));
}

export default function ParticleAccelerator({
  size = 420,
  className = '',
  paused = false,
  showLabel = true,
}) {
  const reactId = useId();
  const gradId = `pa-grad-${reactId.replace(/:/g, '')}`;
  const pulseId = `pa-pulse-${reactId.replace(/:/g, '')}`;

  const innerRing = useMemo(() => buildRing(INNER_RADIUS, PARTICLES_PER_RING), []);
  const outerRing = useMemo(() => buildRing(OUTER_RADIUS, PARTICLES_PER_RING + 6), []);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
      data-paused={paused ? 'true' : 'false'}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width="100%"
        height="100%"
        className="block"
        role="presentation"
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F1DE" stopOpacity="0.18" />
            <stop offset="55%" stopColor="#00F1DE" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#00F1DE" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={pulseId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF00A8" stopOpacity="1" />
            <stop offset="60%" stopColor="#FF00A8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FF00A8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* cyan field wash */}
        <circle cx={VIEWBOX / 2} cy={VIEWBOX / 2} r={VIEWBOX / 2} fill={`url(#${gradId})`} />

        {/* static orbit guides */}
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={INNER_RADIUS}
          fill="none"
          stroke="#00F1DE"
          strokeOpacity="0.28"
          strokeWidth="0.6"
        />
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={OUTER_RADIUS}
          fill="none"
          stroke="#00F1DE"
          strokeOpacity="0.18"
          strokeWidth="0.6"
        />
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={(INNER_RADIUS + OUTER_RADIUS) / 2}
          fill="none"
          stroke="#00F1DE"
          strokeOpacity="0.1"
          strokeWidth="0.4"
          strokeDasharray="2 6"
        />

        {/* crossing constructivist lines */}
        <line
          x1={VIEWBOX / 2 - OUTER_RADIUS * 0.95}
          y1={VIEWBOX / 2}
          x2={VIEWBOX / 2 + OUTER_RADIUS * 0.95}
          y2={VIEWBOX / 2}
          stroke="#00F1DE"
          strokeOpacity="0.08"
          strokeWidth="0.5"
        />
        <line
          x1={VIEWBOX / 2}
          y1={VIEWBOX / 2 - OUTER_RADIUS * 0.95}
          x2={VIEWBOX / 2}
          y2={VIEWBOX / 2 + OUTER_RADIUS * 0.95}
          stroke="#00F1DE"
          strokeOpacity="0.08"
          strokeWidth="0.5"
        />

        {/* inner orbit particles */}
        {innerRing.map((particle, index) => (
          <circle
            key={`inner-${index}`}
            r={particle.size}
            fill="#00F1DE"
            fillOpacity="0.85"
            cx={VIEWBOX / 2 + Math.cos(particle.angle) * particle.radius}
            cy={VIEWBOX / 2 + Math.sin(particle.angle) * particle.radius}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={`0 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              to={`360 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              dur={`${14 / particle.speed}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* outer orbit particles */}
        {outerRing.map((particle, index) => (
          <circle
            key={`outer-${index}`}
            r={particle.size * 0.8}
            fill="#9E7BFF"
            fillOpacity="0.55"
            cx={VIEWBOX / 2 + Math.cos(particle.angle + Math.PI / 6) * particle.radius}
            cy={VIEWBOX / 2 + Math.sin(particle.angle + Math.PI / 6) * particle.radius}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={`360 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              to={`0 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              dur={`${26 / particle.speed}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* fuchsia leading pulse on the inner orbit */}
        <g>
          <circle
            cx={VIEWBOX / 2 + INNER_RADIUS}
            cy={VIEWBOX / 2}
            r={9}
            fill={`url(#${pulseId})`}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={`0 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              to={`-360 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={VIEWBOX / 2 + INNER_RADIUS}
            cy={VIEWBOX / 2}
            r={2.4}
            fill="#FF00A8"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={`0 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              to={`-360 ${VIEWBOX / 2} ${VIEWBOX / 2}`}
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* central Pulse mark */}
        <g transform={`translate(${VIEWBOX / 2} ${VIEWBOX / 2})`}>
          <path
            d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z"
            fill="#FF00A8"
            opacity="0.9"
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0"
              to="45"
              dur="12s"
              repeatCount="indefinite"
              additive="sum"
            />
          </path>
          <circle r="2" fill="#090909" />
        </g>
      </svg>

      {showLabel && (
        <span className="sr-only">Not a Guru particle accelerator — cyan orbits with a fuchsia leading pulse</span>
      )}
    </div>
  );
}
