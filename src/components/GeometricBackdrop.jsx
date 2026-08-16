export default function GeometricBackdrop() {
  return (
    <svg
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ opacity: 0.55 }}
    >
      <defs>
        <linearGradient id="split-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f1de" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#9e7bff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff00a8" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="split-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00f1de" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#3e6bff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff00a8" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="pulse-glow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff00a8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ff00a8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes pulse-fade {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.95; }
        }
        @keyframes split-flow {
          0%, 100% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 40; }
        }
        .split-trace {
          stroke-dasharray: 120 80;
          animation: split-flow 18000ms linear infinite;
        }
      `}</style>

      {/* Split vector: cyan body with fuchsia peaks — Not a Guru signature */}
      <g transform="translate(0, 0)">
        {/* Main trunk: cyan dominant, fuchsia at the far end */}
        <line x1="0" y1="420" x2="520" y2="420" stroke="url(#split-left)" strokeWidth="1.4" opacity="0.7" />
        {/* Split to top-right */}
        <path
          d="M520,420 C720,420 820,260 1200,220"
          fill="none"
          stroke="url(#split-right)"
          strokeWidth="1.4"
          className="split-trace"
          opacity="0.7"
        />
        {/* Split to bottom-right */}
        <path
          d="M520,420 C720,420 820,580 1200,620"
          fill="none"
          stroke="url(#split-left)"
          strokeWidth="1.4"
          className="split-trace"
          opacity="0.7"
        />
        {/* Secondary fork: cyan, low opacity */}
        <path
          d="M880,290 C980,260 1040,180 1140,160"
          fill="none"
          stroke="#00f1de"
          strokeWidth="0.9"
          opacity="0.35"
        />
        <path
          d="M880,550 C980,580 1040,660 1140,680"
          fill="none"
          stroke="#00f1de"
          strokeWidth="0.9"
          opacity="0.35"
        />
      </g>

      {/* Fuchsia pulse marks: four-point stars / asterisks at the nodes
          where the split intersects, per §21.4. */}
      <g transform="translate(520, 420)">
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={Math.cos((i * 45 * Math.PI) / 180) * 22}
            y2={Math.sin((i * 45 * Math.PI) / 180) * 22}
            stroke="#ff00a8"
            strokeWidth="1.2"
            opacity="0.7"
            style={{ animation: `pulse-fade 3000ms ease-in-out infinite`, animationDelay: `${i * 180}ms` }}
          />
        ))}
      </g>

      <g transform="translate(880, 290)">
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={Math.cos((i * 90 * Math.PI) / 180) * 16}
            y2={Math.sin((i * 90 * Math.PI) / 180) * 16}
            stroke="#ff00a8"
            strokeWidth="1"
            opacity="0.65"
            style={{ animation: `pulse-fade 2600ms ease-in-out infinite`, animationDelay: `${i * 220}ms` }}
          />
        ))}
      </g>

      <g transform="translate(880, 550)">
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={Math.cos((i * 90 * Math.PI) / 180) * 16}
            y2={Math.sin((i * 90 * Math.PI) / 180) * 16}
            stroke="#ff00a8"
            strokeWidth="1"
            opacity="0.65"
            style={{ animation: `pulse-fade 2600ms ease-in-out infinite`, animationDelay: `${i * 220 + 400}ms` }}
          />
        ))}
      </g>

      {/* Marginal field lines: cyan carried, lilac + blue receding */}
      <path
        d="M-20,180 Q300,120 600,180 T1220,140"
        fill="none"
        stroke="#9e7bff"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <path
        d="M-20,660 Q300,720 600,660 T1220,700"
        fill="none"
        stroke="#3e6bff"
        strokeWidth="0.8"
        opacity="0.28"
      />
      <path
        d="M-20,400 Q200,360 540,400 T1220,380"
        fill="none"
        stroke="#00f1de"
        strokeWidth="0.7"
        opacity="0.22"
      />

      {/* Constructivist circles and wedges: cyan + silver wireframe */}
      <circle cx="140" cy="200" r="55" fill="none" stroke="#d9d8d2" strokeWidth="0.7" opacity="0.2" />
      <circle cx="140" cy="200" r="35" fill="none" stroke="#00f1de" strokeWidth="0.9" opacity="0.45" />
      <circle cx="140" cy="200" r="14" fill="none" stroke="#ff00a8" strokeWidth="0.8" opacity="0.55" />
      <circle cx="1100" cy="420" r="45" fill="none" stroke="#d9d8d2" strokeWidth="0.7" opacity="0.2" />
      <circle cx="1100" cy="420" r="22" fill="none" stroke="#00f1de" strokeWidth="0.9" opacity="0.45" />
      <polygon points="90,680 140,740 190,680" fill="none" stroke="#00f1de" strokeWidth="0.9" opacity="0.4" />

      {/* Reconnecting line: split resolves — cyan with a fuchsia leading point */}
      <path
        d="M640,420 C760,420 760,450 880,450"
        fill="none"
        stroke="#00f1de"
        strokeWidth="0.9"
        opacity="0.5"
        className="split-trace"
      />
      <circle cx="880" cy="450" r="3" fill="#ff00a8" opacity="0.85" />

      {/* Vertical registration rules: structural, cyan */}
      <line x1="160" y1="0" x2="160" y2="800" stroke="#00f1de" strokeWidth="0.5" opacity="0.12" />
      <line x1="1040" y1="0" x2="1040" y2="800" stroke="#00f1de" strokeWidth="0.5" opacity="0.12" />

      {/* Two horizontal registration rules — fuchsia moments, low opacity,
          placed off the main reading column per §6.1.2. */}
      <line x1="0" y1="120" x2="1200" y2="120" stroke="#ff00a8" strokeWidth="0.4" opacity="0.06" />
      <line x1="0" y1="700" x2="1200" y2="700" stroke="#ff00a8" strokeWidth="0.4" opacity="0.06" />
    </svg>
  );
}
