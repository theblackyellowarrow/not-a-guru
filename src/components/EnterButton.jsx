export default function EnterButton({ onClick, label = 'Enter', size = 'lg', disabled = false }) {
  const dimensionClasses =
    size === 'lg' ? 'w-44 h-44 md:w-52 md:h-52' : 'w-20 h-20 md:w-24 md:h-24';
  const pulseSize = size === 'lg' ? 36 : 16;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`group relative ${dimensionClasses} inline-flex items-center justify-center bg-[#00F1DE] text-[#090909] transition-all duration-200 hover:scale-[1.04] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{
        clipPath:
          'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
      }}
    >
      {/* cyan structural ring */}
      <span
        aria-hidden="true"
        className="absolute inset-0 border-2 border-[#090909] pointer-events-none"
        style={{
          clipPath:
            'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
        }}
      />

      {/* four-point Pulse mark */}
      <svg
        width={pulseSize}
        height={pulseSize}
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="relative z-10 transition-transform duration-300 group-hover:rotate-45 group-focus:rotate-45"
      >
        <path
          d="M 20 0 L 24 16 L 40 20 L 24 24 L 20 40 L 16 24 L 0 20 L 16 16 Z"
          fill="#FF00A8"
        />
        <circle cx="20" cy="20" r="3" fill="#090909" />
      </svg>

      {size === 'lg' && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono uppercase text-[11px] tracking-[0.32em] text-[#090909] z-10">
          {label}
        </span>
      )}

      {/* fuchsia cursor on hover */}
      <span
        aria-hidden="true"
        className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF00A8] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200"
        style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }}
      />

      {/* fuchsia rule that travels the boundary on activation */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-active:opacity-100"
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            fill="none"
            stroke="#FF00A8"
            strokeWidth="0.6"
            strokeDasharray="2 4"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-60" dur="1.4s" repeatCount="indefinite" />
          </rect>
        </svg>
      </span>
    </button>
  );
}
