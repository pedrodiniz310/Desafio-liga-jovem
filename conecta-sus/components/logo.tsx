type LogoMarkProps = {
  className?: string;
};

/**
 * Marca do Tem no SUS!: uma cruz da saúde cujo braço direito termina
 * num "nó" terracota — a ideia de conexão entre a pessoa e o serviço.
 */
export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="11" fill="#0d6a51" />
      <path
        d="M20 11.5v17"
        stroke="#fbf9f2"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <path
        d="M12 20h13"
        stroke="#fbf9f2"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <circle
        cx="28.4"
        cy="20"
        r="3.6"
        fill="#e8714f"
        stroke="#fbf9f2"
        strokeWidth="2.1"
      />
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
