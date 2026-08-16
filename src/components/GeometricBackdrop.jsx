export default function GeometricBackdrop() {
  return (
    <svg
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ mixBlendMode: 'screen', opacity: 0.45 }}
    >
      <defs>
        <linearGradient id="gb-fuchsia" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff0066" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff0066" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="gb-violet" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="gb-coral" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Wireframe cube — top left */}
      <g transform="translate(130, 130)" opacity="0.5">
        <polygon points="0,40 70,0 140,40 70,80" fill="none" stroke="url(#gb-fuchsia)" strokeWidth="1" />
        <polygon points="0,40 70,80 70,160 0,120" fill="none" stroke="url(#gb-fuchsia)" strokeWidth="0.8" />
        <polygon points="70,80 140,40 140,120 70,160" fill="none" stroke="url(#gb-fuchsia)" strokeWidth="0.8" />
        <line x1="0" y1="120" x2="70" y2="160" stroke="url(#gb-fuchsia)" strokeWidth="0.6" opacity="0.5" />
        <line x1="70" y1="0" x2="70" y2="80" stroke="url(#gb-fuchsia)" strokeWidth="0.6" opacity="0.5" />
        <line x1="140" y1="40" x2="140" y2="120" stroke="url(#gb-fuchsia)" strokeWidth="0.6" opacity="0.5" />
      </g>

      {/* Wireframe sphere — bottom right */}
      <g transform="translate(1040, 600)" opacity="0.45">
        <circle r="90" fill="none" stroke="url(#gb-violet)" strokeWidth="1" />
        <ellipse rx="90" ry="28" fill="none" stroke="url(#gb-violet)" strokeWidth="0.8" />
        <ellipse rx="90" ry="28" fill="none" stroke="url(#gb-violet)" strokeWidth="0.8" transform="rotate(60)" />
        <ellipse rx="90" ry="28" fill="none" stroke="url(#gb-violet)" strokeWidth="0.8" transform="rotate(120)" />
      </g>

      {/* Spiral / hourglass shape — right middle */}
      <g transform="translate(1060, 260)" opacity="0.4">
        <path
          d="M0,-80 C50,-40 50,40 0,80 C-50,40 -50,-40 0,-80"
          fill="none"
          stroke="url(#gb-coral)"
          strokeWidth="1"
        />
        <path
          d="M0,-60 C35,-30 35,30 0,60 C-35,30 -35,-30 0,-60"
          fill="none"
          stroke="url(#gb-coral)"
          strokeWidth="0.8"
        />
        <path
          d="M0,-40 C20,-20 20,20 0,40 C-20,20 -20,-20 0,-40"
          fill="none"
          stroke="url(#gb-coral)"
          strokeWidth="0.7"
        />
      </g>

      {/* Wavy horizontal lines */}
      <path
        d="M0,220 Q200,170 400,220 T800,220 T1200,180"
        fill="none"
        stroke="url(#gb-fuchsia)"
        strokeWidth="0.8"
        opacity="0.35"
      />
      <path
        d="M0,580 Q300,640 600,580 T1200,620"
        fill="none"
        stroke="url(#gb-violet)"
        strokeWidth="0.8"
        opacity="0.3"
      />

      {/* Star / asterisk cluster — top right */}
      <g transform="translate(1080, 110)" opacity="0.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={Math.cos((i * 22.5 * Math.PI) / 180) * 70}
            y2={Math.sin((i * 22.5 * Math.PI) / 180) * 70}
            stroke="#ff0066"
            strokeWidth="0.9"
          />
        ))}
        <circle r="12" fill="#ff0066" opacity="0.25" />
      </g>

      {/* Grid rectangles — bottom left */}
      <g transform="translate(80, 620)" opacity="0.35">
        <rect x="0" y="0" width="120" height="120" fill="none" stroke="url(#gb-violet)" strokeWidth="1" />
        <line x1="40" y1="0" x2="40" y2="120" stroke="url(#gb-violet)" strokeWidth="0.6" />
        <line x1="80" y1="0" x2="80" y2="120" stroke="url(#gb-violet)" strokeWidth="0.6" />
        <line x1="0" y1="40" x2="120" y2="40" stroke="url(#gb-violet)" strokeWidth="0.6" />
        <line x1="0" y1="80" x2="120" y2="80" stroke="url(#gb-violet)" strokeWidth="0.6" />
      </g>

      {/* Arcs and rings — left middle */}
      <g transform="translate(90, 360)" opacity="0.35">
        <path d="M0,0 A60,60 0 0,1 120,0" fill="none" stroke="url(#gb-coral)" strokeWidth="1" />
        <path d="M0,20 A50,50 0 0,1 100,20" fill="none" stroke="url(#gb-coral)" strokeWidth="0.8" />
        <path d="M0,40 A40,40 0 0,1 80,40" fill="none" stroke="url(#gb-coral)" strokeWidth="0.7" />
      </g>

      {/* Concentric circles — center, very subtle */}
      <g transform="translate(600, 400)" opacity="0.25">
        <circle r="220" fill="none" stroke="url(#gb-fuchsia)" strokeWidth="0.7" />
        <circle r="170" fill="none" stroke="url(#gb-violet)" strokeWidth="0.6" />
        <circle r="120" fill="none" stroke="url(#gb-fuchsia)" strokeWidth="0.5" />
      </g>

      {/* Thin cross / plus marks */}
      <g stroke="#ff0066" strokeWidth="0.8" opacity="0.35">
        <line x1="260" y1="80" x2="300" y2="80" />
        <line x1="280" y1="60" x2="280" y2="100" />
        <line x1="920" y1="700" x2="960" y2="700" />
        <line x1="940" y1="680" x2="940" y2="720" />
      </g>
    </svg>
  );
}
