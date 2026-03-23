import { createContext, useContext, useState } from 'react';

const StudentsContext = createContext(null);

function buildInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
}

function buildStudentEmail(name) {
  return `${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')}@esi-sba.dz`;
}

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([]);

  function addStudent(student) {
    const safeName = student.name?.trim() || 'New Student';
    const initials = buildInitials(safeName);
    const now = Date.now();
    const hasDepartment = student.department !== undefined;
    const hasSpecialization = student.specialization !== undefined;
    const department = hasDepartment
      ? student.department
      : hasSpecialization
        ? student.specialization
        : 'General Studies';
    const specialization = hasSpecialization ? student.specialization : department;

    setStudents((prev) => [
      ...prev,
      {
        ...student,
        id: `student-${now}`,
        idNumber: student.idNumber || `ST-${now}`,
        initials,
        name: safeName,
        email: student.email || buildStudentEmail(safeName),
        specialization,
        department,
        validation: 'PENDING REVIEW',
        status: 'pending',
        role: 'student',
        accountStatus: student.accountStatus || 'active',
        avatarTone: student.avatarTone || 'blue',
        timestamp: student.timestamp || new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      },
    ]);
  }

  function deleteStudent(id) {
    setStudents((prev) => prev.filter((student) => student.id !== id));
  }

  function updateStudent(id, updates) {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== id) {
          return student;
        }

        const safeName = updates.name?.trim() || student.name;
        const hasDepartment = Object.prototype.hasOwnProperty.call(updates, 'department');
        const hasSpecialization = Object.prototype.hasOwnProperty.call(updates, 'specialization');
        const department = hasDepartment
          ? updates.department
          : hasSpecialization
            ? updates.specialization
            : student.department;
        const specialization = hasSpecialization
          ? updates.specialization
          : hasDepartment
            ? updates.department
            : student.specialization;

        return {
          ...student,
          ...updates,
          name: safeName,
          initials: buildInitials(safeName),
          email: updates.email || student.email || buildStudentEmail(safeName),
          department,
          specialization,
        };
      })
    );
  }

  return (
    <StudentsContext.Provider value={{ students, addStudent, deleteStudent, updateStudent }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  return useContext(StudentsContext);
}
