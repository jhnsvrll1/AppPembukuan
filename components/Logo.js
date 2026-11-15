export default function Logo({ size = 36, text = true }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label="JavaBali Travelmate">
        <circle cx="18" cy="18" r="17" fill="#F5B52E" stroke="#3B2F1E" strokeWidth="1.5" />
        <path d="M2 24 13 11l9 13z" fill="#4F8A4B" /><path d="M16 26 26 12 34 22v4z" fill="#E2601F" />
        <path d="M1.5 24q8-4 16.5 0t16.5-1a17 17 0 0 1-33 1z" fill="#2F7FA6" />
      </svg>
      {text && <div className="leading-tight"><div className="font-bold">JavaBali</div><div className="text-[10px] tracking-[0.25em] text-muted">TRAVELMATE</div></div>}
    </div>
  );
}
