type LogoMarkProps = {
  className?: string;
};

/**
 * Marca do Tem no SUS!: Usando a versão SVG oficial para máxima qualidade.
 */
export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <svg 
      viewBox="0 0 1024 1024" 
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <clipPath id="tile-logo">
        <path d="M200,0 h624 a200,200 0 0 1 200,200 v624 a200,200 0 0 1 -200,200 h-624 a200,200 0 0 1 -200,-200 v-624 a200,200 0 0 1 200,-200 Z" />
      </clipPath>
      <g clipPath="url(#tile-logo)">
        <rect width="1024" height="1024" fill="#0D6A51" />
        <path d="M252,406 h520 a72,72 0 0 1 72,72 v68 a72,72 0 0 1 -72,72 h-520 a72,72 0 0 1 -72,-72 v-68 a72,72 0 0 1 72,-72 Z M478,180 h68 a72,72 0 0 1 72,72 v520 a72,72 0 0 1 -72,72 h-68 a72,72 0 0 1 -72,-72 v-520 a72,72 0 0 1 72,-72 Z" fill="#ffffff" />
        <g fill="none" stroke="#F2683C" strokeWidth="20">
          <circle cx="512" cy="520" r="150" opacity="0.16" />
          <circle cx="512" cy="520" r="224" opacity="0.10" />
        </g>
        <g transform="translate(512 520) rotate(38)">
          <path d="M0 0 C -64.8 -132.84 -108 -212.76 -108 -275.4 A 108 108 0 1 1 108 -275.4 C 108 -212.76 64.8 -132.84 0 0 Z" fill="#F2683C" />
          <circle cx="0" cy="-275.4" r="42.1" fill="#ffffff" />
        </g>
      </g>
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
};

export function Logo({ className = "", markClassName = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={`h-8 w-8 ${markClassName}`} />
      <span className="text-[1.15rem] font-semibold tracking-tight text-ink">
        Tem no <span className="text-verde">SUS!</span>
      </span>
    </span>
  );
}
