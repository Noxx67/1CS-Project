const WEEKDAY_BASE_DATE = Date.UTC(2026, 0, 4);

export function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function formatIsoDate(date) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}

export function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function getActivityWeekdayLabels(locale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: 'UTC',
  });

  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(WEEKDAY_BASE_DATE + index * 86400000)));
}

export function formatDisplayDate(value, locale, emptyLabel) {
  const parsedDate = parseIsoDate(value);
  return parsedDate
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(parsedDate)
    : emptyLabel;
}

export function formatMonthLabel(value, locale) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(value);
}

export function isSameDay(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

export function buildCalendarDays(visibleMonth) {
  const monthStart = getMonthStart(visibleMonth);
  const leadingEmptyDays = monthStart.getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();

  return [
    ...Array.from({ length: leadingEmptyDays }, (_, index) => ({
      key: `blank-${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${index}`,
      isBlank: true,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1);
      return { key: formatIsoDate(date), date, isBlank: false };
    }),
  ];
}
