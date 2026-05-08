const adminDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

const missingDateLabel = '—';

export function formatAdminDate(value: string | number | Date | null | undefined) {
  const date = parseAdminDate(value);
  if (!date) return missingDateLabel;

  return adminDateFormatter
    .format(date)
    .replace(/\b(am|pm)\b/i, suffix => suffix.toUpperCase());
}

export function getAdminDateTimeAttribute(value: string | number | Date | null | undefined) {
  const date = parseAdminDate(value);
  return date?.toISOString();
}

export function getAdminDateTitle(value: string | number | Date | null | undefined) {
  if (typeof value === 'string' && value.trim()) return value;
  return getAdminDateTimeAttribute(value);
}

function parseAdminDate(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
