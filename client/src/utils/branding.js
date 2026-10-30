export function getBrandStyle(color) {
  const hex = /^#[0-9a-f]{6}$/i.test(color || '') ? color.slice(1) : '059669';
  const linearChannel = (start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * linearChannel(0) + 0.7152 * linearChannel(2) + 0.0722 * linearChannel(4);
  const lightContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.05;
  return {
    '--brand': `#${hex}`,
    '--brand-contrast': darkContrast >= lightContrast ? '#0f172a' : '#ffffff',
  };
}
