import { useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useAppPreferences } from '../context/AppPreferencesContext.jsx';
import styles from './SchedulesPage.module.css';
import {
  buildScheduleSessionPatchPayload,
  createEmptyScheduleMetadata,
  createEmptyScheduleSession,
  createScheduleSession,
  deleteScheduleSession,
  fetchScheduleMetadata,
  fetchScheduleSessionById,
  fetchScheduleSessions,
  updateScheduleSession,
  yearSupportsSpecialty,
} from '../services/schedulesEndpoint.js';

const BACK_ICON = '\u2190';
const EDIT_ICON = '\u270E';
const DELETE_ICON = '\u{1F5D1}';
const ADD_ICON = '+';
const REMOVE_ICON = '\u2715';

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function buildSessionDraft(day, termLabel) {
  return {
    ...createEmptyScheduleSession(day),
    termLabel: termLabel || 'Active Academic Term',
  };
}

function getScheduleTypeBadgeClassName(type, classMap) {
  const normalizedType = normalizeValue(type);

  if (normalizedType === 'td' || normalizedType === 'td collectif') {
    return classMap.typeBadgeTd;
  }

  if (normalizedType === 'tp') {
    return classMap.typeBadgeTp;
  }

  return classMap.typeBadgeCours;
}

function sessionTypeRequiresSection(sessionType) {
  const normalizedType = normalizeValue(sessionType);

  return normalizedType !== 'td' && normalizedType !== 'tp';
}

function sessionTypeRequiresGroups(sessionType) {
  const normalizedType = normalizeValue(sessionType);

  return normalizedType === 'td' || normalizedType === 'tp';
}

function normalizeGroupCode(value) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  const numericMatch = trimmedValue.match(/^g?\s*(\d+)$/i);

  if (numericMatch) {
    return `G${Number(numericMatch[1])}`;
  }

  return trimmedValue.toUpperCase().replace(/\s+/g, '');
}

function matchesCurrentFilters(session, filters) {
  return [
    ['day', session.day],
    ['year', session.year],
    ['specialty', session.specialty],
    ['section', session.section],
  ].every(([filterName, sessionValue]) => {
    const filterValue = String(filters[filterName] || '').trim();

    if (!filterValue) {
      return true;
    }

    return normalizeValue(filterValue) === normalizeValue(sessionValue);
  });
}

function validateScheduleForm(formState) {
  const errors = {};
  const shouldRequireSection = sessionTypeRequiresSection(formState.sessionType);
  const shouldRequireGroups = sessionTypeRequiresGroups(formState.sessionType);

  if (!formState.sessionName.trim()) {
    errors.sessionName = 'Session name is required.';
  }

  if (!formState.sessionType.trim()) {
    errors.sessionType = 'Session type is required.';
  }

  if (!formState.responsibleTeacherName.trim()) {
    errors.responsibleTeacherName = 'Responsible teacher is required.';
  }

  if (!formState.year.trim()) {
    errors.year = 'Year is required.';
  }

  if (shouldRequireSection && !formState.section.trim()) {
    errors.section = 'Section is required.';
  } else if (shouldRequireSection && Number(formState.section) < 1) {
    errors.section = 'Section must be at least 1.';
  }

  if (yearSupportsSpecialty(formState.year) && !formState.specialty.trim()) {
    errors.specialty = 'Speciality is required for 2CS and 3CS.';
  }

  if (!formState.day.trim()) {
    errors.day = 'Day is required.';
  }

  if (!formState.startTime.trim()) {
    errors.startTime = 'Start time is required.';
  }

  if (!formState.endTime.trim()) {
    errors.endTime = 'End time is required.';
  }

  if (formState.startTime && formState.endTime && formState.startTime >= formState.endTime) {
    errors.endTime = 'End time must be after start time.';
  }

  if (shouldRequireGroups && formState.assignedGroups.length === 0) {
    errors.assignedGroups = 'Add at least one group.';
  }

  if (!formState.room.trim()) {
    errors.room = 'Room is required.';
  }

  return errors;
}

function getFieldClassName(fieldName, formErrors, baseClassName, invalidClassName) {
  return formErrors[fieldName]
    ? `${baseClassName} ${invalidClassName}`
    : baseClassName;
}

export default function SchedulesPage() {
  const { t } = useAppPreferences();
  const { addNotification } = useNotifications();
  const teacherSearchRef = useRef(null);
  const [metadata, setMetadata] = useState(createEmptyScheduleMetadata());
  const [filters, setFilters] = useState({
    day: createEmptyScheduleMetadata().days[0],
    year: '',
    specialty: '',
    section: '',
  });
  const [sessions, setSessions] = useState([]);
  const [viewMode, setViewMode] = useState('directory');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [formState, setFormState] = useState(buildSessionDraft(createEmptyScheduleMetadata().days[0], createEmptyScheduleMetadata().termLabel));
  const [initialFormState, setInitialFormState] = useState(buildSessionDraft(createEmptyScheduleMetadata().days[0], createEmptyScheduleMetadata().termLabel));
  const [groupInput, setGroupInput] = useState('');
  const [isTeacherSearchOpen, setIsTeacherSearchOpen] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directoryError, setDirectoryError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const isEditing = viewMode === 'edit';
  const pageTitle = isEditing ? 'Edit Session' : 'Create Session';
  const cardTitle = isEditing ? 'Edit Session Details' : 'Create Session Details';
  const submitLabel = isEditing ? t('common.saveChanges') : 'Create Session';
  const activeTermLabel = sessions[0]?.termLabel || metadata.termLabel;
  const hasActiveFilters = Boolean(filters.year || filters.specialty || filters.section);
  const draftChangesCount = Object.keys(buildScheduleSessionPatchPayload(initialFormState, formState)).length;
  const isDirty = draftChangesCount > 0;
  const formYearSupportsSpecialty = yearSupportsSpecialty(formState.year);
  const formSessionRequiresSection = sessionTypeRequiresSection(formState.sessionType);
  const formSessionRequiresGroups = sessionTypeRequiresGroups(formState.sessionType);
  const filterYearSupportsSpecialty = !filters.year || yearSupportsSpecialty(filters.year);
  const specialtyOptions = metadata.specialties.filter((specialty) => normalizeValue(specialty) !== 'n/a');
  const filteredTeacherOptions = useMemo(() => {
    const normalizedTeacherQuery = normalizeValue(formState.responsibleTeacherName);
    const teachers = Array.isArray(metadata.teachers) ? metadata.teachers : [];

    if (!normalizedTeacherQuery) {
      return teachers.slice(0, 8);
    }

    return teachers
      .filter((teacher) => normalizeValue(teacher.name).includes(normalizedTeacherQuery))
      .slice(0, 8);
  }, [formState.responsibleTeacherName, metadata.teachers]);

  const normalizedTypedGroup = useMemo(
    () => normalizeGroupCode(groupInput),
    [groupInput]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMetadata() {
      try {
        const nextMetadata = await fetchScheduleMetadata();

        if (!isMounted) {
          return;
        }

        setMetadata(nextMetadata);
        setFilters((currentFilters) => ({
          ...currentFilters,
          day: currentFilters.day || nextMetadata.days[0] || 'Sunday',
        }));
      } catch (error) {
        console.error('Failed to load schedule metadata:', error);

        if (!isMounted) {
          return;
        }

        setMetadata(createEmptyScheduleMetadata());
      }
    }

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      setDirectoryLoading(true);
      setDirectoryError('');

      try {
        const nextSessions = await fetchScheduleSessions(filters);

        if (!isMounted) {
          return;
        }

        setSessions(nextSessions);
      } catch (error) {
        console.error('Failed to load schedule sessions:', error);

        if (!isMounted) {
          return;
        }

        setSessions([]);
        setDirectoryError('Failed to load sessions.');
      } finally {
        if (isMounted) {
          setDirectoryLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!teacherSearchRef.current?.contains(event.target)) {
        setIsTeacherSearchOpen(false);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (formSessionRequiresSection || !formState.section) {
      return;
    }

    setFormState((currentState) => ({
      ...currentState,
      section: '',
    }));
  }, [formSessionRequiresSection, formState.section]);

  useEffect(() => {
    if (formSessionRequiresGroups || formState.assignedGroups.length === 0) {
      return;
    }

    setFormState((currentState) => ({
      ...currentState,
      assignedGroups: [],
    }));
  }, [formSessionRequiresGroups, formState.assignedGroups]);

  useEffect(() => {
    if (filterYearSupportsSpecialty || !filters.specialty) {
      return;
    }

    setFilters((currentFilters) => ({
      ...currentFilters,
      specialty: '',
    }));
  }, [filterYearSupportsSpecialty, filters.specialty]);

  useEffect(() => {
    if (formYearSupportsSpecialty || formState.specialty === 'N/A') {
      return;
    }

    setFormState((currentState) => ({
      ...currentState,
      specialty: 'N/A',
    }));
  }, [formYearSupportsSpecialty, formState.specialty]);

  function clearFieldError(fieldName) {
    setFormErrors((currentErrors) => {
      if (!currentErrors[fieldName] && !currentErrors.submit) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      delete nextErrors.submit;
      return nextErrors;
    });
  }

  function handleFilterChange(fieldName, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [fieldName]: value,
    }));
  }

  function handleOpenCreateView() {
    const nextDraft = buildSessionDraft(filters.day || metadata.days[0] || 'Sunday', metadata.termLabel);

    setSelectedSessionId('');
    setFormState(nextDraft);
    setInitialFormState(nextDraft);
    setFormErrors({});
    setViewMode('create');
  }

  async function handleOpenEditView(sessionId) {
    setSelectedSessionId(sessionId);
    setFormErrors({});
    setViewMode('edit');
    setEditorLoading(true);

    try {
      const selectedSession = await fetchScheduleSessionById(sessionId);
      setFormState(selectedSession);
      setInitialFormState(selectedSession);
    } catch (error) {
      console.error('Failed to load session for editing:', error);
      addNotification({
        icon: '\u26A0',
        title: 'Unable to open session',
        sub: error.message || 'The session could not be loaded.',
      });
      setViewMode('directory');
      setSelectedSessionId('');
    } finally {
      setEditorLoading(false);
    }
  }

  function handleCloseEditor() {
    const nextDraft = buildSessionDraft(filters.day || metadata.days[0] || 'Sunday', metadata.termLabel);

    setViewMode('directory');
    setSelectedSessionId('');
    setFormState(nextDraft);
    setInitialFormState(nextDraft);
    setFormErrors({});
    setGroupInput('');
    setIsTeacherSearchOpen(false);
  }

  function handleInputChange(fieldName, value) {
    setFormState((currentState) => {
      if (fieldName === 'year') {
        const nextYearSupportsSpecialty = yearSupportsSpecialty(value);
        const currentYearSupportsSpecialty = yearSupportsSpecialty(currentState.year);

        return {
          ...currentState,
          year: value,
          specialty: nextYearSupportsSpecialty
            ? (currentYearSupportsSpecialty ? currentState.specialty : '')
            : 'N/A',
        };
      }

      if (fieldName === 'sessionType') {
        const nextSessionRequiresSection = sessionTypeRequiresSection(value);
        const nextSessionRequiresGroups = sessionTypeRequiresGroups(value);

        return {
          ...currentState,
          sessionType: value,
          section: nextSessionRequiresSection ? currentState.section : '',
          assignedGroups: nextSessionRequiresGroups ? currentState.assignedGroups : [],
        };
      }

      return {
        ...currentState,
        [fieldName]: value,
      };
    });
    clearFieldError(fieldName);
  }

  function handleTeacherChange(value) {
    const matchedTeacher = metadata.teachers.find(
      (teacher) => normalizeValue(teacher.name) === normalizeValue(value)
    );

    setFormState((currentState) => ({
      ...currentState,
      responsibleTeacherId: matchedTeacher?.id || '',
      responsibleTeacherName: value,
    }));
    setIsTeacherSearchOpen(true);
    clearFieldError('responsibleTeacherName');
  }

  function handleAddGroup() {
    if (!formSessionRequiresGroups) {
      return;
    }

    if (!normalizedTypedGroup) {
      return;
    }

    if (formState.assignedGroups.includes(normalizedTypedGroup)) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        assignedGroups: 'This group is already assigned.',
      }));
      return;
    }

    setFormState((currentState) => ({
      ...currentState,
      assignedGroups: [...currentState.assignedGroups, normalizedTypedGroup].sort((firstGroup, secondGroup) =>
        firstGroup.localeCompare(secondGroup, undefined, { numeric: true })
      ),
    }));
    setGroupInput('');
    clearFieldError('assignedGroups');
  }

  function handleTeacherSelect(teacher) {
    setFormState((currentState) => ({
      ...currentState,
      responsibleTeacherId: teacher.id || '',
      responsibleTeacherName: teacher.name || '',
    }));
    setIsTeacherSearchOpen(false);
    clearFieldError('responsibleTeacherName');
  }

  function handleGroupInputKeyDown(event) {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    handleAddGroup();
  }

  function handleRemoveGroup(groupCode) {
    setFormState((currentState) => ({
      ...currentState,
      assignedGroups: currentState.assignedGroups.filter((assignedGroup) => assignedGroup !== groupCode),
    }));
  }

  async function refreshSessions(nextFilters = filters) {
    const nextSessions = await fetchScheduleSessions(nextFilters);
    setSessions(nextSessions);
    return nextSessions;
  }

  async function handleDeleteSession(session) {
    const confirmDelete = window.confirm(`Delete ${session.sessionName}?`);

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteScheduleSession(session.id);
      await refreshSessions(filters);
      addNotification({
        icon: DELETE_ICON,
        title: 'Session deleted',
        sub: `${session.sessionName} has been removed from the schedule.`,
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      addNotification({
        icon: '\u26A0',
        title: 'Failed to delete session',
        sub: error.message || 'Please try again.',
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateScheduleForm(formState);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    if (isEditing && !isDirty) {
      handleCloseEditor();
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const savedSession = isEditing
        ? await updateScheduleSession(selectedSessionId, formState, initialFormState)
        : await createScheduleSession(formState);

      await refreshSessions(filters);
      handleCloseEditor();

      addNotification({
        icon: isEditing ? EDIT_ICON : ADD_ICON,
        title: isEditing ? 'Session updated' : 'Session created',
        sub: matchesCurrentFilters(savedSession, filters)
          ? `${savedSession.sessionName} is ready in the current schedule view.`
          : `${savedSession.sessionName} was saved. Adjust filters to see it here.`,
      });
    } catch (error) {
      console.error('Failed to save schedule session:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save session.';

      setFormErrors({ submit: errorMessage });
      addNotification({
        icon: '\u26A0',
        title: 'Failed to save session',
        sub: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFieldError(fieldName) {
    return formErrors[fieldName]
      ? <span className={styles.fieldError}>{formErrors[fieldName]}</span>
      : null;
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <>
        <section className={styles.editorTopbar}>
          <div className={styles.editorTopbarCopy}>
            <button
              type="button"
              className={styles.backButton}
              aria-label="Back to schedules"
              onClick={handleCloseEditor}
            >
              {BACK_ICON}
            </button>
            <div>
              <h1 className={styles.editorTitle}>{pageTitle}</h1>
              <p className={styles.editorSubtitle}>ESI Sidi Bel Abbes Schedule Management System</p>
            </div>
          </div>
        </section>

        <div className={`page-body ${styles.pageBody}`} aria-busy={editorLoading || isSubmitting}>
          <section className={styles.editorCard}>
            <div className={styles.editorCardHeader}>
              <h2 className={styles.editorCardTitle}>{cardTitle}</h2>
              <span className={styles.draftBadge}>
                {isDirty ? 'Draft Changes' : isEditing ? 'Loaded Session' : 'New Session'}
              </span>
            </div>

            {editorLoading ? (
              <div className={styles.editorState}>Loading session details...</div>
            ) : (
              <form className={styles.editorForm} onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Session Name</span>
                    <input
                      type="text"
                      className={getFieldClassName(
                        'sessionName',
                        formErrors,
                        styles.input,
                        styles.inputInvalid
                      )}
                      value={formState.sessionName}
                      onChange={(event) => handleInputChange('sessionName', event.target.value)}
                    />
                    {renderFieldError('sessionName')}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Session Type</span>
                    <select
                      className={getFieldClassName(
                        'sessionType',
                        formErrors,
                        styles.select,
                        styles.inputInvalid
                      )}
                      value={formState.sessionType}
                      onChange={(event) => handleInputChange('sessionType', event.target.value)}
                    >
                      {metadata.sessionTypes.map((sessionType) => (
                        <option key={sessionType} value={sessionType}>
                          {sessionType}
                        </option>
                      ))}
                    </select>
                    {renderFieldError('sessionType')}
                  </label>

                  <label className={`${styles.field} ${styles.fieldFull}`} ref={teacherSearchRef}>
                    <span className={styles.fieldLabel}>Responsible Teacher</span>
                    <input
                      type="text"
                      className={getFieldClassName(
                        'responsibleTeacherName',
                        formErrors,
                        styles.input,
                        styles.inputInvalid
                      )}
                      value={formState.responsibleTeacherName}
                      onChange={(event) => handleTeacherChange(event.target.value)}
                      onFocus={() => setIsTeacherSearchOpen(true)}
                      autoComplete="off"
                      placeholder="Type to search a teacher"
                    />
                    {isTeacherSearchOpen && filteredTeacherOptions.length > 0 && (
                      <div className={styles.teacherResults}>
                        {filteredTeacherOptions.map((teacher) => (
                          <button
                            key={teacher.id}
                            type="button"
                            className={styles.teacherResultButton}
                            onClick={() => handleTeacherSelect(teacher)}
                          >
                            {teacher.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {renderFieldError('responsibleTeacherName')}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Year</span>
                    <select
                      className={getFieldClassName('year', formErrors, styles.select, styles.inputInvalid)}
                      value={formState.year}
                      onChange={(event) => handleInputChange('year', event.target.value)}
                    >
                      {metadata.years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {renderFieldError('year')}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Section</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      className={getFieldClassName(
                        'section',
                        formErrors,
                        `${styles.input} ${!formSessionRequiresSection ? styles.selectDisabled : ''}`,
                        styles.inputInvalid
                      )}
                      value={formState.section}
                      onChange={(event) => handleInputChange('section', event.target.value)}
                      placeholder={formSessionRequiresSection ? '1' : 'Not used for TD/TP'}
                      disabled={!formSessionRequiresSection}
                    />
                    {renderFieldError('section')}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Speciality</span>
                    <select
                      className={getFieldClassName(
                        'specialty',
                        formErrors,
                        `${styles.select} ${!formYearSupportsSpecialty ? styles.selectDisabled : ''}`,
                        styles.inputInvalid
                      )}
                      value={formState.specialty}
                      onChange={(event) => handleInputChange('specialty', event.target.value)}
                      disabled={!formYearSupportsSpecialty}
                    >
                      {formYearSupportsSpecialty && (
                        <option value="">Select speciality</option>
                      )}
                      {(formYearSupportsSpecialty ? specialtyOptions : ['N/A']).map((specialty) => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                    {renderFieldError('specialty')}
                  </label>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.fieldLabel}>Assigned Groups</span>
                    <div className={`${styles.groupPicker} ${!formSessionRequiresGroups ? styles.groupPickerDisabled : ''}`}>
                      <div className={styles.groupTags}>
                        {formState.assignedGroups.length === 0 ? (
                          <span className={styles.emptyHint}>
                            {formSessionRequiresGroups ? 'No groups assigned yet.' : 'Not used for Cours or TD collectif.'}
                          </span>
                        ) : (
                          formState.assignedGroups.map((groupCode) => (
                            <button
                              key={groupCode}
                              type="button"
                              className={styles.groupTag}
                              onClick={() => handleRemoveGroup(groupCode)}
                            >
                              <span>{groupCode}</span>
                              <span className={styles.groupTagRemove}>{REMOVE_ICON}</span>
                            </button>
                          ))
                        )}
                      </div>

                      <div className={styles.groupAddRow}>
                        <input
                          type="text"
                          className={`${styles.groupSelect} ${!formSessionRequiresGroups ? styles.selectDisabled : ''}`}
                          value={groupInput}
                          onChange={(event) => setGroupInput(event.target.value)}
                          onKeyDown={handleGroupInputKeyDown}
                          placeholder={formSessionRequiresGroups ? 'Write group number or code' : 'Not used for Cours or TD collectif'}
                          disabled={!formSessionRequiresGroups}
                        />
                        <button
                          type="button"
                          className={styles.addGroupButton}
                          onClick={handleAddGroup}
                          disabled={!formSessionRequiresGroups || !normalizedTypedGroup}
                        >
                          {ADD_ICON} Add Group
                        </button>
                      </div>
                    </div>
                    {renderFieldError('assignedGroups')}
                  </div>

                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span className={styles.fieldLabel}>Room / Location</span>
                    <input
                      type="text"
                      className={getFieldClassName('room', formErrors, styles.input, styles.inputInvalid)}
                      value={formState.room}
                      onChange={(event) => handleInputChange('room', event.target.value)}
                      placeholder="Amphi A"
                    />
                    {renderFieldError('room')}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Day</span>
                    <select
                      className={getFieldClassName('day', formErrors, styles.select, styles.inputInvalid)}
                      value={formState.day}
                      onChange={(event) => handleInputChange('day', event.target.value)}
                    >
                      {metadata.days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    {renderFieldError('day')}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Start Time</span>
                    <input
                      type="time"
                      className={getFieldClassName('startTime', formErrors, styles.input, styles.inputInvalid)}
                      value={formState.startTime}
                      onChange={(event) => handleInputChange('startTime', event.target.value)}
                    />
                    {renderFieldError('startTime')}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>End Time</span>
                    <input
                      type="time"
                      className={getFieldClassName('endTime', formErrors, styles.input, styles.inputInvalid)}
                      value={formState.endTime}
                      onChange={(event) => handleInputChange('endTime', event.target.value)}
                    />
                    {renderFieldError('endTime')}
                  </label>
                </div>

                {formErrors.submit && (
                  <p className={styles.submitError}>{formErrors.submit}</p>
                )}

                <div className={styles.editorActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCloseEditor}
                    disabled={isSubmitting}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting || editorLoading || (isEditing && !isDirty)}
                  >
                    {isSubmitting ? t('common.saving') : submitLabel}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </>
    );
  }

  return (
    <div className={`page-body ${styles.pageBody}`} aria-busy={directoryLoading}>
      <section className={styles.listHeader}>
        <div>
          <p className={styles.pageEyebrow}>Schedule Management</p>
          <h1 className={styles.pageTitle}>Sessions:</h1>
        </div>
      </section>

      <section className={styles.dayTabs} aria-label="Schedule days">
        {metadata.days.map((day) => (
          <button
            key={day}
            type="button"
            className={`${styles.dayTab} ${filters.day === day ? styles.dayTabActive : ''}`}
            onClick={() => handleFilterChange('day', day)}
          >
            {day}
          </button>
        ))}
      </section>

      <section className={styles.filtersGrid}>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Year</span>
          <select
            className={styles.filterSelect}
            value={filters.year}
            onChange={(event) => handleFilterChange('year', event.target.value)}
          >
            <option value="">All years</option>
            {metadata.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Speciality</span>
          <select
            className={`${styles.filterSelect} ${!filterYearSupportsSpecialty ? styles.selectDisabled : ''}`}
            value={filters.specialty}
            onChange={(event) => handleFilterChange('specialty', event.target.value)}
            disabled={!filterYearSupportsSpecialty}
          >
            <option value="">All specialities</option>
            {specialtyOptions.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Section</span>
          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            className={styles.filterSelect}
            value={filters.section}
            onChange={(event) => handleFilterChange('section', event.target.value)}
            placeholder="Any section"
          />
        </label>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.termLabel}>{activeTermLabel}</span>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearFiltersButton}
              onClick={() => setFilters((currentFilters) => ({
                ...currentFilters,
                year: '',
                specialty: '',
                section: '',
              }))}
            >
              {t('common.clear')}
            </button>
          )}
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Type</th>
                <th>Groups</th>
                <th>Responsible</th>
                <th>Time &amp; Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={6}>
                    {directoryLoading
                      ? 'Loading sessions...'
                      : directoryError || (hasActiveFilters
                        ? 'No sessions match the selected filters.'
                        : 'No sessions available for this day yet.')}
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <span className={styles.sessionName}>{session.sessionName}</span>
                    </td>
                    <td>
                      <span
                        className={`${styles.typeBadge} ${getScheduleTypeBadgeClassName(session.sessionType, styles)}`}
                      >
                        {session.sessionType}
                      </span>
                    </td>
                    <td>
                      <div className={styles.groupList}>
                        {session.assignedGroups.map((groupCode) => (
                          <span key={groupCode} className={styles.tableGroup}>
                            {groupCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.responsibleText}>{session.responsibleTeacherName}</td>
                    <td>
                      <div className={styles.timeBlock}>
                        <span className={styles.timePrimary}>
                          {session.day}, {session.startTime} - {session.endTime}
                        </span>
                        <span className={styles.timeSecondary}>{session.room}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={`Edit ${session.sessionName}`}
                          onClick={() => handleOpenEditView(session.id)}
                        >
                          {EDIT_ICON}
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          aria-label={`Delete ${session.sessionName}`}
                          onClick={() => handleDeleteSession(session)}
                        >
                          {DELETE_ICON}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.listActions}>
        <button
          type="button"
          className={styles.createSessionButton}
          onClick={handleOpenCreateView}
        >
          <span className={styles.createSessionIcon}>{ADD_ICON}</span>
          Add Session
        </button>
      </div>
    </div>
  );
}
