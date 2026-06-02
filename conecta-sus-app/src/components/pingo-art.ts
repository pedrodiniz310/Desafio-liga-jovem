// Arte do mascote Pingo (SVG inline, renderizado via react-native-svg SvgXml).
// 4 poses geradas no Claude Design. Mantém o viewBox original de cada uma.

export type PingoPose = "acenando" | "apontando" | "checklist" | "icone";

/** Proporção altura/largura de cada pose (do viewBox), p/ escalar sem distorcer. */
export const PINGO_RATIO: Record<PingoPose, number> = {
  acenando: 470 / 400,
  apontando: 470 / 460,
  checklist: 470 / 400,
  icone: 410 / 296,
};

export const PINGO_ART: Record<PingoPose, string> = {
  acenando: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 470" role="img" aria-label="Pingo acenando">
  <clipPath id="pg_acen"><path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z"/></clipPath>
  <path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z" fill="#F2683C"/>
  <g clip-path="url(#pg_acen)">
    <ellipse cx="208" cy="470" rx="180" ry="152" fill="#964025" opacity="0.14"/>
    <ellipse cx="150" cy="92" rx="84" ry="52" fill="#ffffff" opacity="0.2"/>
  </g>
  <path d="M102,240 Q66,206 58,150" fill="none" stroke="#F2683C" stroke-width="27" stroke-linecap="round"/>
  <circle cx="56" cy="144" r="17.01" fill="#FBF7EE"/>
  <path d="M298,240 Q332,266 334,304" fill="none" stroke="#F2683C" stroke-width="27" stroke-linecap="round"/>
  <circle cx="336" cy="308" r="16.2" fill="#FBF7EE"/>
  <g fill="#ffffff" opacity="0.9"><rect x="188" y="308" width="24" height="60" rx="8"/><rect x="170" y="326" width="60" height="24" rx="8"/></g>
  <circle cx="200" cy="160" r="85.1" fill="#FBF7EE"/>
  <circle cx="146.387" cy="177.02" r="11.063" fill="#F2683C" opacity="0.26"/>
  <circle cx="253.613" cy="177.02" r="11.063" fill="#F2683C" opacity="0.26"/>
  <g fill="#0B3B2E"><circle cx="173.619" cy="149.788" r="13.403"/><circle cx="226.381" cy="149.788" r="13.403"/></g>
  <g fill="#ffffff" opacity="0.92"><circle cx="177.874" cy="145.533" r="4.557"/><circle cx="230.636" cy="145.533" r="4.557"/></g>
  <path d="M174.47,180.424 Q200,203.401 225.53,180.424" fill="none" stroke="#0B3B2E" stroke-width="8.0845" stroke-linecap="round"/>
</svg>`,

  apontando: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 470" role="img" aria-label="Pingo apontando o caminho">
  <clipPath id="pg_apon"><path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z"/></clipPath>
  <path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z" fill="#F2683C"/>
  <g clip-path="url(#pg_apon)">
    <ellipse cx="208" cy="470" rx="180" ry="152" fill="#964025" opacity="0.14"/>
    <ellipse cx="150" cy="92" rx="84" ry="52" fill="#ffffff" opacity="0.2"/>
  </g>
  <path d="M102,242 Q80,278 78,310" fill="none" stroke="#F2683C" stroke-width="27" stroke-linecap="round"/>
  <circle cx="76" cy="314" r="15.39" fill="#FBF7EE"/>
  <path d="M298,236 Q356,220 400,196" fill="none" stroke="#F2683C" stroke-width="27" stroke-linecap="round"/>
  <line x1="404" y1="192" x2="430" y2="174" stroke="#FBF7EE" stroke-width="17.01" stroke-linecap="round"/><circle cx="404" cy="192" r="16.2" fill="#FBF7EE"/>
  <g fill="#ffffff" opacity="0.9"><rect x="188" y="308" width="24" height="60" rx="8"/><rect x="170" y="326" width="60" height="24" rx="8"/></g>
  <circle cx="200" cy="160" r="85.1" fill="#FBF7EE"/>
  <circle cx="146.387" cy="177.02" r="11.063" fill="#F2683C" opacity="0.26"/>
  <circle cx="253.613" cy="177.02" r="11.063" fill="#F2683C" opacity="0.26"/>
  <g fill="#0B3B2E"><circle cx="177.4485" cy="149.788" r="13.403"/><circle cx="230.2105" cy="149.788" r="13.403"/></g>
  <g fill="#ffffff" opacity="0.92"><circle cx="181.7035" cy="145.533" r="4.557"/><circle cx="234.4655" cy="145.533" r="4.557"/></g>
  <path d="M174.47,180.424 Q200,203.401 225.53,180.424" fill="none" stroke="#0B3B2E" stroke-width="8.0845" stroke-linecap="round"/>
</svg>`,

  checklist: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 470" role="img" aria-label="Pingo com checklist">
  <clipPath id="pg_chk"><path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z"/></clipPath>
  <path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z" fill="#F2683C"/>
  <g clip-path="url(#pg_chk)">
    <ellipse cx="208" cy="470" rx="180" ry="152" fill="#964025" opacity="0.14"/>
    <ellipse cx="150" cy="92" rx="84" ry="52" fill="#ffffff" opacity="0.2"/>
  </g>
  <circle cx="200" cy="150" r="85.1" fill="#FBF7EE"/>
  <circle cx="146.387" cy="167.02" r="11.063" fill="#F2683C" opacity="0.26"/>
  <circle cx="253.613" cy="167.02" r="11.063" fill="#F2683C" opacity="0.26"/>
  <g fill="#0B3B2E"><circle cx="173.619" cy="139.788" r="13.403"/><circle cx="226.381" cy="139.788" r="13.403"/></g>
  <g fill="#ffffff" opacity="0.92"><circle cx="177.874" cy="135.533" r="4.557"/><circle cx="230.636" cy="135.533" r="4.557"/></g>
  <path d="M174.47,170.424 Q200,193.401 225.53,170.424" fill="none" stroke="#0B3B2E" stroke-width="8.0845" stroke-linecap="round"/>
  <g transform="rotate(-7 200 316)">
    <rect x="146" y="272" width="108" height="88" rx="12" fill="#FBF7EE"/>
    <rect x="146" y="272" width="108" height="88" rx="12" fill="none" stroke="#E6DDC9" stroke-width="3"/>
    <rect x="180" y="264" width="42" height="17" rx="7" fill="#0D6A51"/>
    <circle cx="170" cy="300" r="7" fill="none" stroke="#0D6A51" stroke-width="3"/>
    <path d="M166.5,300 l2.8,3.2 l5,-6.4" fill="none" stroke="#0D6A51" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="186" y="297" width="50" height="6" rx="3" fill="#bd512f" opacity="0.55"/>
    <circle cx="170" cy="321" r="7" fill="none" stroke="#0D6A51" stroke-width="3"/>
    <path d="M166.5,321 l2.8,3.2 l5,-6.4" fill="none" stroke="#0D6A51" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="186" y="318" width="50" height="6" rx="3" fill="#bd512f" opacity="0.55"/>
    <circle cx="170" cy="342" r="7" fill="none" stroke="#0D6A51" stroke-width="3"/>
    <path d="M166.5,342 l2.8,3.2 l5,-6.4" fill="none" stroke="#0D6A51" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="186" y="339" width="40" height="6" rx="3" fill="#bd512f" opacity="0.55"/>
  </g>
  <path d="M108,236 Q120,288 150,312" fill="none" stroke="#F2683C" stroke-width="27" stroke-linecap="round"/>
  <circle cx="150" cy="314" r="14.58" fill="#FBF7EE"/>
  <path d="M292,236 Q280,288 250,312" fill="none" stroke="#F2683C" stroke-width="27" stroke-linecap="round"/>
  <circle cx="250" cy="314" r="14.58" fill="#FBF7EE"/>
</svg>`,

  icone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="52 36 296 410" role="img" aria-label="Pingo">
  <clipPath id="pg_ico"><path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z"/></clipPath>
  <path d="M200,432 L306.5,225.4 A120,120 0 1 0 93.5,225.4 Z" fill="#F2683C"/>
  <g clip-path="url(#pg_ico)">
    <ellipse cx="208" cy="470" rx="180" ry="152" fill="#964025" opacity="0.14"/>
    <ellipse cx="150" cy="92" rx="84" ry="52" fill="#ffffff" opacity="0.2"/>
  </g>
  <circle cx="200" cy="150" r="71.3" fill="#FBF7EE"/>
  <g fill="#0B3B2E"><circle cx="177.897" cy="141.444" r="13.251"/><circle cx="222.103" cy="141.444" r="13.251"/></g>
  <g fill="#ffffff" opacity="0.92"><circle cx="181.462" cy="137.879" r="4.505"/><circle cx="225.668" cy="137.879" r="4.505"/></g>
  <path d="M178.61,167.112 Q200,186.363 221.39,167.112" fill="none" stroke="#0B3B2E" stroke-width="6.7735" stroke-linecap="round"/>
</svg>`,
};
