import { useEffect, useMemo, useState } from 'react';
import ScolaritePageHeader from '../components/ScolaritePageHeader';
import UserManagementPage from '../components/UserManagementPage';
import { useAbsenceRecords } from '../context/AbsenceRecordsContext';
import { useUsers } from '../context/UsersContext';
import { exportTableToCsv } from '../utils/exportTableToCsv';
import ScolariteStudentProfilePage from './ScolariteStudentProfilePage';
import dashboardStyles from './ScolariteDashboardPage.module.css';
import styles from './ScolariteStudentsPage.module.css';

const pageSize = 6;

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || 'ST';
}

function getAbsenceCount(absenceRecords, student) {
  return absenceRecords.filter((record) => {
    const studentId = record.student_id || record.studentId || record.student?.id;
    const studentCode = record.student_code || record.studentCode || record.registration_number || record.registrationNumber;
    const studentName = record.student_name || record.studentName || record.student?.full_name || record.student?.name;

    return String(studentId || '') === String(student.id || '')
      || String(studentCode || '') === String(student.idNumber || '')
      || String(studentName || '').toLowerCase() === String(student.name || '').toLowerCase();
  }).length;
}

function getStudentStatus(absenceCount) {
  if (absenceCount > 3) {
    return { label: 'Critical', tone: 'danger' };
  }

  if (absenceCount >= 2) {
    return { label: 'Warning', tone: 'warning' };
  }

  return { label: 'Good', tone: 'success' };
}

function matchesSearch(values, searchQuery) {
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
}

function Icon({ name }) {
  if (name === 'export') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v10" />
        <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
        <path d="M5 18.5h14" />
      </svg>
    );
  }

  if (name === 'add') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.8 18.5a5.2 5.2 0 0 1 9.1-3.4" />
        <path d="M17 11v6M14 14h6" />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.2" />
        <path d="M20 20l-4.2-4.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.2" />
      <path d="M12 8v4l2.5 1.6" />
    </svg>
  );
}

function MetricCard({ label, value, helper, tone }) {
  const toneClass = dashboardStyles[`metricIcon${tone}`] || dashboardStyles.metricIconblue;

  return (
    <article className={dashboardStyles.metricCard}>
      <div className={dashboardStyles.metricCopy}>
        <strong className={`${dashboardStyles.metricValue} ${tone === 'red' ? dashboardStyles.metricValueDanger : ''}`}>
          {value}
        </strong>
        <span className={dashboardStyles.metricLabel}>{label}</span>
        <span className={dashboardStyles.metricHelper}>{helper}</span>
      </div>
      <span className={`${dashboardStyles.metricIcon} ${toneClass}`}>
        <Icon />
      </span>
    </article>
  );
}

export default function ScolariteStudentsPage() {
  const { users, isLoading, error, fetchAllUsers } = useUsers();
  const absenceRecordsContext = useAbsenceRecords();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('directory');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const absenceRecords = absenceRecordsContext?.absenceRecords || [];

  useEffect(() => {
    fetchAllUsers({ role: 'STUDENT' }).catch(() => {});
  }, [fetchAllUsers]);

  const students = useMemo(
    () => users
      .filter((user) => String(user.role || '').toLowerCase() === 'student')
      .map((student) => {
        const absenceCount = getAbsenceCount(absenceRecords, student);
        return {
          ...student,
          absenceCount,
          attendanceStatus: getStudentStatus(absenceCount),
        };
      }),
    [absenceRecords, users],
  );

  const departments = useMemo(() => [...new Set(students.map((student) => student.department).filter(Boolean))], [students]);
  const levels = useMemo(() => [...new Set(students.map((student) => student.promotion || student.year).filter(Boolean))], [students]);

  const visibleStudents = useMemo(
    () => students.filter((student) => (
      (!departmentFilter || student.department === departmentFilter)
      && (!levelFilter || String(student.promotion || student.year) === levelFilter)
      && (!statusFilter || student.attendanceStatus.label === statusFilter)
      && matchesSearch([
        student.name,
        student.idNumber,
        student.email,
        student.department,
        student.promotion,
        student.year,
      ], searchQuery)
    )),
    [departmentFilter, levelFilter, searchQuery, statusFilter, students],
  );

  const pageCount = Math.max(1, Math.ceil(visibleStudents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedStudents = visibleStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const perfectAttendanceCount = students.filter((student) => student.absenceCount === 0).length;
  const warningCount = students.filter((student) => student.attendanceStatus.tone === 'warning').length;
  const criticalCount = students.filter((student) => student.attendanceStatus.tone === 'danger').length;

  useEffect(() => {
    setPage(1);
  }, [departmentFilter, levelFilter, searchQuery, statusFilter]);

  function exportStudents() {
    exportTableToCsv({
      filename: 'student_directory.csv',
      headers: ['Student', 'Student ID', 'Department', 'Level', 'Email', 'Phone', 'Total Absences', 'Status'],
      rows: visibleStudents.map((student) => [
        student.name,
        student.idNumber,
        student.department,
        student.promotion || student.year,
        student.email,
        student.phone,
        student.absenceCount,
        student.attendanceStatus.label,
      ]),
    });
  }

  function clearFilters() {
    setSearchQuery('');
    setDepartmentFilter('');
    setLevelFilter('');
    setStatusFilter('');
  }

  const paginationPages = useMemo(() => {
    const visiblePages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(visiblePages)
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
      .sort((firstPage, secondPage) => firstPage - secondPage);
  }, [currentPage, pageCount]);

  if (viewMode === 'create') {
    return (
      <UserManagementPage
        initialViewMode="create"
        initialCreateRole="student"
        lockCreateRole
        onCloseFormView={() => setViewMode('directory')}
      />
    );
  }

  if (viewMode === 'profile' && selectedStudentId) {
    return (
      <ScolariteStudentProfilePage
        studentId={selectedStudentId}
        onCloseFormView={() => {
          setSelectedStudentId('');
          setViewMode('directory');
        }}
        onBack={() => {
          setSelectedStudentId('');
          setViewMode('directory');
        }}
      />
    );
  }

  return (
    <div className={dashboardStyles.page}>
      <ScolaritePageHeader
        title="Students List"
        breadcrumb="Home / Students"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className={dashboardStyles.content}>
        {error ? <div className={dashboardStyles.errorBanner}>{error}</div> : null}

        <section className={dashboardStyles.metricsGrid}>
          <MetricCard label="Total Enrolled" value={students.length} helper="Across all departments" tone="blue" />
          <MetricCard label="Perfect Attendance" value={perfectAttendanceCount} helper="0 absences this semester" tone="success" />
          <MetricCard label="At Risk (Warning)" value={warningCount} helper="2-3 absences recorded" tone="orange" />
          <MetricCard label="Critical Status" value={criticalCount} helper=">3 absences recorded" tone="red" />
        </section>

        <section className={dashboardStyles.panel}>
          <div className={styles.directoryHeader}>
            <div>
              <h2>Student Directory</h2>
              <p>Manage student profiles, view their attendance history, and track their overall absence status.</p>
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.secondaryButton} onClick={exportStudents}>
                <Icon name="export" />
                Export List
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => setViewMode('create')}>
                <Icon name="add" />
                Add Student
              </button>
            </div>
          </div>

          <section className={styles.filtersPanel}>
            <label className={styles.filterField}>
              <span>Search</span>
              <div className={styles.searchBox}>
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name or ID..." />
                <Icon name="search" />
              </div>
            </label>
            <label className={styles.filterField}>
              <span>Department</span>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">All Departments</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Level</span>
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                <option value="">All Levels</option>
                {levels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All Statuses</option>
                {['Good', 'Warning', 'Critical'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <button type="button" className={styles.clearButton} onClick={clearFilters}>
              Clear Filters
            </button>
          </section>

          <div className={dashboardStyles.tableWrap}>
            <table className={`${dashboardStyles.absenceTable} ${styles.studentsTable}`}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department & Level</th>
                  <th>Contact</th>
                  <th>Total Absences</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className={dashboardStyles.tableState}>Loading students...</td></tr>
                ) : pagedStudents.length === 0 ? (
                  <tr><td colSpan={6} className={dashboardStyles.tableState}>No students match the current filters.</td></tr>
                ) : pagedStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className={styles.studentCell}>
                        <span>{student.profilePicture ? <img src={student.profilePicture} alt="" /> : getInitials(student.name)}</span>
                        <strong>{student.name || '-'}</strong>
                        <small>{student.idNumber || '-'}</small>
                      </div>
                    </td>
                    <td>
                      <strong className={styles.departmentText}>{student.department || '-'}</strong>
                      <small className={styles.levelText}>{student.promotion || student.year || '-'}</small>
                    </td>
                    <td>
                      <strong className={styles.departmentText}>{student.email || '-'}</strong>
                      <small className={styles.levelText}>{student.phone || '-'}</small>
                    </td>
                    <td>{student.absenceCount}</td>
                    <td>
                      <span className={`${dashboardStyles.statusBadge} ${dashboardStyles[`status${student.attendanceStatus.tone}`]}`}>
                        {student.attendanceStatus.label}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={dashboardStyles.viewButton}
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setViewMode('profile');
                        }}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className={styles.tableFooter}>
            <span>Showing {visibleStudents.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, visibleStudents.length)} of {visibleStudents.length} students</span>
            <div className={styles.pagination}>
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>‹</button>
              {paginationPages.map((pageNumber) => (
                <button key={pageNumber} type="button" className={pageNumber === currentPage ? styles.paginationActive : ''} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
              ))}
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>›</button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
