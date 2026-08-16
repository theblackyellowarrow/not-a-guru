export default function GeometricBackdrop() {
  return (
    <svg
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-[0.35]"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="g-fuchsia" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff0066" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff0066" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-violet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-coral" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff0066" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Large soft fuchsia field */}
      <circle cx="900" cy="200" r="420" fill="url(#g-fuchsia)" />
      {/* Soft violet field */}
      <circle cx="200" cy="650" r="360" fill="url(#g-violet)" />
      {/* Coral accent */}
      <circle cx="1100" cy="700" r="260" fill="url(#g-coral)" />

      {/* Wireframe ellipse */}
      <ellipse
        cx="600"
        cy="400"
        rx="320"
        ry="180"
        fill="none"
        stroke="url(#g-line)"
        strokeWidth="1.2"
        opacity="0.5"
      />
      <ellipse
        cx="600"
        cy="400"
        rx="260"
        ry="140"
        fill="none"
        stroke="#ff0066"
        strokeWidth="0.8"
        opacity="0.25"
      />

      {/* Starburst */}
      <g transform="translate(600, 400)" opacity="0.35">
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={Math.cos((i * 15 * Math.PI) / 180) * 220}
            y2={Math.sin((i * 15 * Math.PI) / 180) * 220}
            stroke="#ff0066"
            strokeWidth="0.8"
          />
        ))}
        <circle r="28" fill="#ff0066" opacity="0.25" />
      </g>

      {/* Floating triangles */}
      <polygon points="140,120 220,260 80,260" fill="#ff0066" opacity="0.15" />
      <polygon points="1050,140 1180,280 980,280" fill="#8b5cf6" opacity="0.12" />
      <polygon points="160,620 280,720 120,740" fill="#ff6b6b" opacity="0.12" />

      {/* Thin wave lines */}
      <path
        d="M0,180 Q300,80 600,180 T1200,120"
        fill="none"
        stroke="url(#g-line)"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M0,620 Q400,720 800,620 T1200,680"
        fill="none"
        stroke="url(#g-line)"
        strokeWidth="1"
        opacity="0.35"
      />

      {/* Small circles */}
      <circle cx="320" cy="180" r="45" fill="none" stroke="#ff0066" strokeWidth="1.2" opacity="0.35" />
      <circle cx="980" cy="520" r="30" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.35" />
      <circle cx="450" cy="700" r="22" fill="#ff0066" opacity="0.18" />
      <circle cx="750" cy="120" r="18" fill="#ff6b6b" opacity="0.2" />

      {/* Vertical scanline feel */}
      <line x1="150" y1="0" x2="150" y2="800" stroke="#ff0066" strokeWidth="0.5" opacity="0.12" />
      <line x1="1050" y1="0" x2="1050" y2="800" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.12" />
    </svg>
  );
}
