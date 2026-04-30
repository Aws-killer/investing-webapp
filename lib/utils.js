export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const formatTZS = (value, options = {}) => {
  const { isCompact = false, decimals = 2 } = options;
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';

  if (isCompact) {
    return new Intl.NumberFormat('en-TZ', {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2
    }).format(num);
  }

  return new Intl.NumberFormat('en-TZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};
