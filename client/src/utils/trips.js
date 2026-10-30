import { formatCurrency } from './formatters.js';

export function priceLabel(trip) {
  return trip.price_mode === 'flexible'
    ? `From ${formatCurrency(trip.min_amount)}`
    : formatCurrency(trip.price_per_seat);
}

export function formatDeparture(value) {
  if (!value) return 'Departure time to be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Departure time to be announced';
  return date.toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// Background style for a trip cover: the uploaded photo, or a brand-colour gradient.
export function coverStyle(url) {
  if (url) {
    return {
      backgroundImage: `url("${String(url).replace(/"/g, '%22')}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundImage: 'linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 55%, #0f172a))' };
}
