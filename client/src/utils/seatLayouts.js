// Bus seating layouts. Seats are numbered row by row, left to right, so a trip
// only needs to store its layout key and seat count.
export const SEAT_LAYOUTS = {
  '2+3': { label: '2 + 3', left: 2, right: 3, hint: '2 seats on one side of the aisle, 3 on the other (5 per row)' },
  '2+2': { label: '2 + 2', left: 2, right: 2, hint: '2 seats on each side of the aisle (4 per row)' },
};

export const DEFAULT_SEAT_LAYOUT = '2+3';

export function normalizeLayout(key) {
  return SEAT_LAYOUTS[key] ? key : DEFAULT_SEAT_LAYOUT;
}

// Returns [{ left: ['1','2'], right: ['3','4','5'] }, ...]. Missing seats on the last row are null.
export function buildSeatRows(seatCount, layoutKey) {
  const { left, right } = SEAT_LAYOUTS[normalizeLayout(layoutKey)];
  const perRow = left + right;
  const total = Math.max(0, Number(seatCount) || 0);
  const rows = [];
  for (let start = 0; start < total; start += perRow) {
    const cells = Array.from({ length: perRow }, (_, index) => (start + index < total ? String(start + index + 1) : null));
    rows.push({ left: cells.slice(0, left), right: cells.slice(left) });
  }
  return rows;
}
