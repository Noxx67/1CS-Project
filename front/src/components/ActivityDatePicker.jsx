import { useEffect, useRef, useState } from 'react';
import styles from './ActivityDatePicker.module.css';
import {
  buildCalendarDays,
  getActivityWeekdayLabels,
  formatDisplayDate,
  formatIsoDate,
  formatMonthLabel,
  getMonthStart,
  isSameDay,
  parseIsoDate,
  shiftMonth,
} from '../utils/activityDatePicker';
import { useAppPreferences } from '../context/AppPreferencesContext';

const CALENDAR_ICON = '\u{1F4C5}';
const PREV_ICON = '\u2039';
const NEXT_ICON = '\u203A';

export default function ActivityDatePicker({ value, onChange }) {
  const { locale, t } = useAppPreferences();
  const pickerRef = useRef(null);
  const selectedDate = parseIsoDate(value);
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate ? getMonthStart(selectedDate) : getMonthStart(today)
  );

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setVisibleMonth(getMonthStart(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  const calendarDays = buildCalendarDays(visibleMonth);
  const monthLabel = formatMonthLabel(visibleMonth, locale);
  const weekdayLabels = getActivityWeekdayLabels(locale);

  function handleSelectDate(date) {
    onChange(formatIsoDate(date));
    setVisibleMonth(getMonthStart(date));
    setIsOpen(false);
  }

  function handleToggleOpen() {
    setIsOpen((currentValue) => !currentValue);
  }

  function handleClear() {
    onChange('');
    setIsOpen(false);
  }

  function handleToday() {
    handleSelectDate(today);
  }

  return (
    <div className={styles.wrapper} ref={pickerRef}>
      <button
        type="button"
        className={`${styles.trigger} ${value ? styles.triggerFilled : ''}`}
        onClick={handleToggleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={styles.triggerText}>
          {formatDisplayDate(value, locale, t('activity.allDates'))}
        </span>
        <span className={styles.triggerIcon} aria-hidden="true">{CALENDAR_ICON}</span>
      </button>

      {isOpen && (
        <div className={styles.popover} role="dialog" aria-label={t('activity.choosePeriodDate')}>
          <div className={styles.popoverHeader}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setVisibleMonth((currentMonth) => shiftMonth(currentMonth, -1))}
              aria-label={t('activity.previousMonth')}
            >
              {PREV_ICON}
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setVisibleMonth((currentMonth) => shiftMonth(currentMonth, 1))}
              aria-label={t('activity.nextMonth')}
            >
              {NEXT_ICON}
            </button>
          </div>

          <div className={styles.weekdays}>
            {weekdayLabels.map((weekday) => (
              <span key={weekday} className={styles.weekday}>{weekday}</span>
            ))}
          </div>

          <div className={styles.grid}>
            {calendarDays.map((day) => {
              if (day.isBlank) {
                return <span key={day.key} className={styles.dayBlank} aria-hidden="true" />;
              }

              const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
              const isToday = isSameDay(day.date, today);

              return (
                <button
                  key={day.key}
                  type="button"
                  className={[
                    styles.day,
                    isSelected ? styles.daySelected : '',
                    isToday ? styles.dayToday : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleSelectDate(day.date)}
                  aria-pressed={isSelected}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleClear}
            >
              {t('common.clear')}
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
              onClick={handleToday}
            >
              {t('common.today')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
