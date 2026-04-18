import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './AcademicYearPicker.module.css';
import { useAppPreferences } from '../context/AppPreferencesContext';

const PREV_ICON = '\u2039';
const NEXT_ICON = '\u203A';

function getCurrentYear() {
  return new Date().getFullYear();
}

function getStartYear(value) {
  const matchedYear = String(value || '').match(/^(\d{4})/);
  return matchedYear ? Number(matchedYear[1]) : null;
}

function formatAcademicYear(year) {
  if (!year) {
    return '';
  }

  return `${year} - ${year + 1}`;
}

function buildYearRange(baseYear) {
  const rangeStart = Math.floor(baseYear / 12) * 12;
  return Array.from({ length: 12 }, (_, index) => rangeStart + index);
}

export default function AcademicYearPicker({
  value,
  onChange,
  label,
}) {
  const { t } = useAppPreferences();
  const resolvedLabel = label || t('settings.selectAcademicYear');
  const pickerRef = useRef(null);
  const selectedStartYear = getStartYear(value);
  const initialYear = selectedStartYear || getCurrentYear();
  const [isOpen, setIsOpen] = useState(false);
  const [rangeYear, setRangeYear] = useState(initialYear);

  useEffect(() => {
    if (selectedStartYear) {
      setRangeYear(selectedStartYear);
    }
  }, [selectedStartYear]);

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
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const yearRange = useMemo(() => buildYearRange(rangeYear), [rangeYear]);
  const rangeLabel = `${yearRange[0]} - ${yearRange[yearRange.length - 1]}`;

  return (
    <div className={styles.wrapper} ref={pickerRef}>
      <button
        type="button"
        className={`${styles.trigger} ${value ? styles.triggerFilled : ''}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span>{value || resolvedLabel}</span>
        <span className={styles.triggerIcon} aria-hidden="true">{'\u{1F4C5}'}</span>
      </button>

      {isOpen && (
        <div className={styles.popover} role="dialog" aria-label={resolvedLabel}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setRangeYear((currentYear) => currentYear - 12)}
              aria-label={t('settings.previousYears')}
            >
              {PREV_ICON}
            </button>
            <span className={styles.rangeLabel}>{rangeLabel}</span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setRangeYear((currentYear) => currentYear + 12)}
              aria-label={t('settings.nextYears')}
            >
              {NEXT_ICON}
            </button>
          </div>

          <div className={styles.grid}>
            {yearRange.map((year) => (
              <button
                key={year}
                type="button"
                className={`${styles.yearButton} ${selectedStartYear === year ? styles.yearButtonActive : ''}`}
                onClick={() => {
                  onChange(formatAcademicYear(year));
                  setIsOpen(false);
                }}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
