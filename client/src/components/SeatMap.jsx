import { useState } from 'react';
import { BusFront } from 'lucide-react';
import { SEAT_LAYOUTS, buildSeatRows, normalizeLayout } from '../utils/seatLayouts.js';

const seatBase = 'flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition sm:h-11 sm:w-11';

// One seat map used everywhere: the passenger booking page and the organizer dashboard.
//  - Passenger mode: pass onToggle, selectedSeats, takenSeats (+ seatNames).
//  - Organizer mode: omit onToggle (read only); pass seatInfo = { '12': { name, status } }.
export function SeatMap({
  seatCount, layout, takenSeats = [], seatNames = {}, seatInfo = {}, selectedSeats = [], onToggle, className = '',
}) {
  const [infoSeat, setInfoSeat] = useState(null);
  const rows = buildSeatRows(seatCount, layout);
  const taken = new Set(takenSeats);
  const interactive = typeof onToggle === 'function';
  const payerSeat = selectedSeats[0];

  function click(seat) {
    if (taken.has(seat)) { setInfoSeat(infoSeat === seat ? null : seat); return; }
    setInfoSeat(null);
    if (interactive) onToggle(seat);
  }

  function seatClass(seat) {
    if (taken.has(seat)) {
      return seatInfo[seat]?.status === 'held'
        ? 'border-amber-500 bg-amber-100 text-amber-800'
        : 'border-red-500 bg-red-100 text-red-700';
    }
    if (payerSeat === seat) return 'border-yellow-500 bg-yellow-200 text-yellow-900 ring-2 ring-yellow-400/60';
    if (selectedSeats.includes(seat)) return 'border-amber-500 bg-amber-200 text-amber-900';
    return `border-green-400 bg-green-100 text-green-800 ${interactive ? 'hover:bg-green-200' : ''}`;
  }

  function renderSeat(seat, key) {
    if (!seat) return <span key={key} className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden="true" />;
    const isTaken = taken.has(seat);
    const isHeld = isTaken && seatInfo[seat]?.status === 'held';
    const name = seatNames[seat] || seatInfo[seat]?.name;
    return (
      <button key={seat} type="button" onClick={() => click(seat)}
        aria-label={isTaken ? `Seat ${seat}, ${isHeld ? 'held for payment' : 'taken'}${name ? ` by ${name}` : ''}` : `Seat ${seat}${selectedSeats.includes(seat) ? ', selected' : ''}`}
        aria-pressed={interactive && !isTaken ? selectedSeats.includes(seat) : undefined}
        className={`${seatBase} ${seatClass(seat)} ${!interactive && !isTaken ? 'cursor-default' : ''}`}>
        {seat}
      </button>
    );
  }

  const info = infoSeat ? { name: seatNames[infoSeat] || seatInfo[infoSeat]?.name, status: seatInfo[infoSeat]?.status } : null;
  const isHeldInfo = info?.status === 'held';

  return (
    <div className={className}>
      {infoSeat && (
        <div role="status" className={`mb-3 rounded-2xl border p-3 text-sm ${isHeldInfo ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          Seat {infoSeat} {info.status === 'held' ? 'is being held for' : 'is registered to'}{' '}
          <span className="font-semibold">{info.name || 'a passenger'}</span>
          {info.status === 'held' ? ' (payment pending)' : ''}.
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mx-auto w-fit">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 text-xs font-semibold text-slate-800 sm:h-11">
              <BusFront size={16} aria-hidden="true" /> FRONT
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-400 bg-slate-200 text-[0.6rem] font-bold text-slate-700 sm:h-11 sm:w-11" title="Driver">DRV</div>
          </div>
          <div className="grid gap-2">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-center gap-2">
                <div className="flex gap-2">{row.left.map((seat, i) => renderSeat(seat, `l${rowIndex}-${i}`))}</div>
                <div className="flex w-6 justify-center" aria-hidden="true"><div className="h-8 w-[2px] rounded bg-slate-200" /></div>
                <div className="flex gap-2">{row.right.map((seat, i) => renderSeat(seat, `r${rowIndex}-${i}`))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
        <span className="flex items-center gap-2"><i className="h-4 w-4 rounded border border-green-500 bg-green-100" />Available</span>
        {interactive && <span className="flex items-center gap-2"><i className="h-4 w-4 rounded border border-amber-500 bg-amber-200" />Selected</span>}
        {interactive && <span className="flex items-center gap-2"><i className="h-4 w-4 rounded border border-yellow-500 bg-yellow-200" />Payer</span>}
        <span className="flex items-center gap-2"><i className="h-4 w-4 rounded border border-red-500 bg-red-100" />Taken (tap for name)</span>
        {Object.values(seatInfo).some((seat) => seat.status === 'held') && <span className="flex items-center gap-2"><i className="h-4 w-4 rounded border border-amber-500 bg-amber-100" />Held (payment pending)</span>}
      </div>
    </div>
  );
}

function MiniPreview({ layoutKey }) {
  const { left, right } = SEAT_LAYOUTS[layoutKey];
  const dot = <span className="block h-3 w-3 rounded-[4px] bg-emerald-400" />;
  return (
    <div className="grid gap-1" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center justify-center gap-1">
          <div className="flex gap-1">{Array.from({ length: left }, (_, i) => <span key={i}>{dot}</span>)}</div>
          <span className="w-3" />
          <div className="flex gap-1">{Array.from({ length: right }, (_, i) => <span key={i}>{dot}</span>)}</div>
        </div>
      ))}
    </div>
  );
}

// Organizer picks which seating layout their bus has.
export function SeatLayoutPicker({ value, onChange, disabled = false }) {
  const current = normalizeLayout(value);
  return (
    <div role="radiogroup" aria-label="Bus seat layout" className="grid gap-3 sm:grid-cols-2">
      {Object.entries(SEAT_LAYOUTS).map(([key, config]) => {
        const active = key === current;
        return (
          <button key={key} type="button" role="radio" aria-checked={active} disabled={disabled} onClick={() => onChange(key)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition disabled:opacity-60 ${active ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <span className="shrink-0 rounded-xl bg-white p-2 shadow-sm"><MiniPreview layoutKey={key} /></span>
            <span>
              <span className="block font-semibold text-slate-900">{config.label} layout</span>
              <span className="mt-0.5 block text-xs text-slate-600">{config.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
