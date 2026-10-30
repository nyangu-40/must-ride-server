// Built-in illustrations (no image files needed, so they always match the brand colour).

export function BusIllustration({ className = '' }) {
  const windows = Array.from({ length: 5 }, (_, i) => 118 + i * 58);
  return (
    <svg viewBox="0 0 520 320" role="img" aria-label="Illustration of a coach bus on the road" className={className}>
      <defs>
        <linearGradient id="bus-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bae6fd" /><stop offset="1" stopColor="#ecfdf5" />
        </linearGradient>
      </defs>
      <rect width="520" height="320" rx="28" fill="url(#bus-sky)" />
      <circle cx="430" cy="70" r="30" fill="#fde68a" />
      <g fill="#fff" opacity=".9">
        <ellipse cx="90" cy="64" rx="38" ry="12" /><ellipse cx="116" cy="54" rx="26" ry="11" />
        <ellipse cx="320" cy="96" rx="32" ry="10" /><ellipse cx="342" cy="88" rx="20" ry="9" />
      </g>
      <path d="M0 214 C70 160 140 190 210 170 C290 146 350 190 430 166 C470 154 500 164 520 170 V320 H0Z" fill="#a7f3d0" />
      <path d="M0 236 C90 200 170 226 260 206 C350 186 430 214 520 198 V320 H0Z" fill="#6ee7b7" />
      <rect y="250" width="520" height="70" fill="#334155" />
      <g fill="#e2e8f0">{[10, 100, 190, 280, 370, 460].map((x) => <rect key={x} x={x} y="283" width="48" height="6" rx="3" />)}</g>
      <ellipse cx="260" cy="262" rx="190" ry="9" fill="#0f172a" opacity=".25" />
      <rect x="62" y="120" width="396" height="132" rx="24" fill="#fff" />
      <path d="M62 196 H458 V228 a24 24 0 0 1 -24 24 H86 a24 24 0 0 1 -24 -24Z" style={{ fill: 'var(--brand, #047857)' }} />
      <rect x="62" y="190" width="396" height="6" fill="#fbbf24" />
      <rect x="62" y="120" width="396" height="12" rx="6" fill="#e2e8f0" />
      <g>{windows.map((x) => <rect key={x} x={x} y="140" width="42" height="40" rx="8" fill="#7dd3fc" stroke="#0369a1" strokeWidth="2" />)}</g>
      <path d="M404 140 h30 a18 18 0 0 1 18 18 v22 h-48z" fill="#7dd3fc" stroke="#0369a1" strokeWidth="2" />
      <rect x="78" y="140" width="30" height="64" rx="6" fill="#bae6fd" stroke="#0369a1" strokeWidth="2" />
      <circle cx="450" cy="214" r="7" fill="#fde047" /><rect x="64" y="210" width="9" height="12" rx="3" fill="#ef4444" />
      {[148, 380].map((cx) => (
        <g key={cx}><circle cx={cx} cy="254" r="30" fill="#0f172a" /><circle cx={cx} cy="254" r="15" fill="#cbd5e1" /><circle cx={cx} cy="254" r="5" fill="#475569" /></g>
      ))}
    </svg>
  );
}

// Top-down view of a 2 + 3 bus: used as the booking page banner.
export function SeatsIllustration({ className = '' }) {
  const columns = Array.from({ length: 9 }, (_, i) => 70 + i * 58);
  const seatStyle = (col, row) => {
    const key = `${col}-${row}`;
    if (['1-0', '4-2', '4-3', '6-1', '7-4', '2-3'].includes(key)) return { fill: '#fecaca', stroke: '#f87171' };
    if (['5-0', '5-1'].includes(key)) return { fill: '#fde68a', stroke: '#f59e0b' };
    return { fill: '#ffffff', stroke: '#bbf7d0' };
  };
  const rowsY = [34, 80, 150, 196, 242];
  return (
    <svg viewBox="0 0 640 280" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of bus seats" className={className}>
      <rect x="20" y="10" width="600" height="260" rx="44" fill="#fff" opacity=".14" />
      <rect x="20" y="10" width="600" height="260" rx="44" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" />
      <rect x="40" y="112" width="560" height="38" rx="19" fill="#fff" opacity=".12" />
      <g opacity=".95"><rect x="38" y="40" width="40" height="46" rx="10" fill="#fff" opacity=".35" /><circle cx="58" cy="63" r="12" fill="none" stroke="#fff" strokeWidth="3" /></g>
      {columns.slice(1).map((x, col) => rowsY.map((y, row) => {
        const { fill, stroke } = seatStyle(col, row);
        return (
          <g key={`${col}-${row}`}>
            <rect x={x} y={y} width="38" height="36" rx="10" fill={fill} stroke={stroke} strokeWidth="2.5" />
            <rect x={x - 6} y={y + 4} width="9" height="28" rx="4" fill={stroke} opacity=".8" />
          </g>
        );
      }))}
    </svg>
  );
}
