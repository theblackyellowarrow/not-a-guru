export default function OrbitMark({ size = 28, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <defs>
          <radialGradient id="om-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F1DE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00F1DE" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#om-grad)" />
        <circle cx="16" cy="16" r="9" fill="none" stroke="#00F1DE" strokeOpacity="0.5" strokeWidth="0.8" />
        <circle cx="16" cy="16" r="13" fill="none" stroke="#00F1DE" strokeOpacity="0.25" strokeWidth="0.5" strokeDasharray="1 3" />
        <g>
          <circle cx="25" cy="16" r="1.6" fill="#FF00A8" />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 16 16"
            to="360 16 16"
            dur="6s"
            repeatCount="indefinite"
          />
        </g>
        <path d="M 16 12 L 18 16 L 16 20 L 14 16 Z" fill="#FF00A8" opacity="0.85" />
      </svg>
    </span>
  );
}
