const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/;

function pad(value) {
  return String(value).padStart(2, '0');
}

function hasTimezone(value) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
}

function validDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function localPartsFromDate(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

function partsFromValue(value, defaultHour = 14, defaultMinute = 0) {
  if (!value) return null;
  if (value instanceof Date) return validDate(value) ? localPartsFromDate(value) : null;

  const stringValue = String(value);
  if (hasTimezone(stringValue)) {
    const date = new Date(stringValue);
    return validDate(date) ? localPartsFromDate(date) : null;
  }

  const match = stringValue.match(LOCAL_DATE_TIME_PATTERN);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] === undefined ? defaultHour : Number(match[4]);
  const minute = match[5] === undefined ? defaultMinute : Number(match[5]);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (!validDate(date) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return { year, month, day, hour, minute };
}

export function formatLocalDateTime(value, options = {}) {
  const parts = partsFromValue(value, options.defaultHour ?? 14, options.defaultMinute ?? 0);
  if (!parts) return '';
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function localDateTimeToISOString(value, options = {}) {
  if (!value) return null;
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  if (hasTimezone(stringValue)) {
    const date = new Date(stringValue);
    return validDate(date) ? date.toISOString() : null;
  }

  const parts = partsFromValue(stringValue, options.defaultHour ?? 0, options.defaultMinute ?? 0);
  if (!parts) return null;
  const date = new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
  return validDate(date) ? date.toISOString() : null;
}

export function localDateTimeFromNow(days = 0, hour = 14, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return formatLocalDateTime(date);
}

export function dateTimeParts(value, options = {}) {
  return partsFromValue(value, options.defaultHour ?? 14, options.defaultMinute ?? 0);
}
