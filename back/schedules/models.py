from django.db import models
from django.conf import settings
from accounts.models import StudentProfile

class Session(models.Model):
    title = models.CharField(max_length=255, verbose_name='Titre de la session')
    session_type = models.CharField(max_length=50, verbose_name='Type de session')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions', verbose_name='Enseignant')
    year = models.CharField(max_length=50, verbose_name='Année')
    specialty = models.CharField(max_length=100, blank=True, null=True, verbose_name='Spécialité')
    section = models.IntegerField(blank=True, null=True, verbose_name='Section')
    assigned_groups = models.JSONField(default=list, blank=True, verbose_name='Groupes assignés')
    day = models.CharField(max_length=20, verbose_name='Jour')
    start_time = models.TimeField(verbose_name='Heure de début')
    end_time = models.TimeField(verbose_name='Heure de fin')
    room = models.CharField(max_length=100, verbose_name='Salle')

    class Meta:
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'

    def __str__(self):
        return f"{self.title} ({self.session_type}) - {self.teacher.full_name}"

    def get_numeric_year(self):
        """Map promotion names like 1CS, 2CP to absolute years 1-5."""
        import re
        raw_year = str(self.year or '').upper()
        if 'CS' in raw_year:
            match = re.search(r'(\d+)', raw_year)
            return int(match.group(1)) + 2 if match else None
        else:
            match = re.search(r'(\d+)', raw_year)
            return int(match.group(1)) if match else None

class SessionInstance(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='instances')
    date = models.DateField(verbose_name='Date')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    teacher_note = models.TextField(blank=True, null=True, verbose_name='Note de l enseignant')

    class Meta:
        verbose_name = 'Instance de Session'
        verbose_name_plural = 'Instances de Session'
        unique_together = ('session', 'date')

    def __str__(self):
        return f"{self.session.title} - {self.date}"

class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('present', 'Présent'),
        ('absent', 'Absent'),
        ('unmarked', 'Non marqué'),
    ]
    session_instance = models.ForeignKey(SessionInstance, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unmarked')

    class Meta:
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'
        unique_together = ('session_instance', 'student')

    def __str__(self):
        return f"{self.student.full_name} - {self.session_instance} - {self.get_status_display()}"

class AbsenceCounter(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='absence_counters')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='absence_counters')
    absence_count = models.IntegerField(default=0, verbose_name='Nombre d absences')
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Compteur d absences'
        verbose_name_plural = 'Compteurs d absences'
        unique_together = ('student', 'session')

    def __str__(self):
        return f"{self.student.full_name} - {self.session.title}: {self.absence_count} absences"

class Justification(models.Model):
    TYPE_CHOICES = [
        ('MEDICAL', 'Médical'),
        ('TRANSPORT', 'Transport'),
        ('FAMILY', 'Famille'),
        ('OTHER', 'Autre'),
    ]
    STATUS_CHOICES = [
        ('EN ATTENTE', 'En attente'),
        ('JUSTIFIÉE', 'Justifiée'),
        ('INJUSTIFIÉE', 'Injustifiée'),
    ]
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='justifications')
    attendance_record = models.OneToOneField(AttendanceRecord, on_delete=models.CASCADE, related_name='justification', null=True, blank=True)
    exam_attendance_record = models.OneToOneField('ExamAttendanceRecord', on_delete=models.CASCADE, related_name='justification', null=True, blank=True)

    justification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    file = models.FileField(upload_to='justifications/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN ATTENTE')
    submission_date = models.DateTimeField(auto_now_add=True)
    student_comment = models.TextField(blank=True, null=True)
    scholarite_comment = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Justificatif'
        verbose_name_plural = 'Justificatifs'

    def __str__(self):
        rec = self.attendance_record or self.exam_attendance_record
        return f"Justificatif - {self.student.full_name} - {rec}"



# ============================================================
# EXAM MODELS
# ============================================================

class Exam(models.Model):
    class ExamType(models.TextChoices):
        TD            = 'TD',            'TD'
        TD_COLLECTIF  = 'TD_COLLECTIF',  'TD Collectif'
        EXAM          = 'EXAM',          'Examen'
        PARTIEL       = 'PARTIEL',       'Partiel'

    module      = models.CharField(max_length=255, verbose_name='Module')
    exam_type   = models.CharField(max_length=20, choices=ExamType.choices, default=ExamType.TD)
    date        = models.DateField(verbose_name='Date')
    start_time  = models.TimeField(verbose_name='Heure de début')
    end_time    = models.TimeField(verbose_name='Heure de fin')
    year        = models.CharField(max_length=10, verbose_name='Promotion')   # e.g. '1CS'
    speciality  = models.CharField(max_length=100, blank=True, null=True, verbose_name='Spécialité')
    teachers    = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='exam_supervisions',
        limit_choices_to={'role': 'TEACHER'},
        blank=True,
    )
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_exams',
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    is_replacement = models.BooleanField(default=False, verbose_name='Examen de remplacement')
    original_exam = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='replacement_exams', verbose_name='Examen original'
    )

    class Meta:
        verbose_name = 'Examen'
        verbose_name_plural = 'Examens'
        ordering = ['-date', 'start_time']

    def __str__(self):
        return f"{self.module} ({self.exam_type}) — {self.date}"

    def get_numeric_year(self):
        """Map '1CS' → 3, '2CPI' → 2, etc. (same logic as Session)."""
        import re
        raw = str(self.year or '').upper()
        if 'CS' in raw:
            m = re.search(r'(\d+)', raw)
            return int(m.group(1)) + 2 if m else None
        m = re.search(r'(\d+)', raw)
        return int(m.group(1)) if m else None


class ExamRoom(models.Model):
    class RoomType(models.TextChoices):
        AMPHI = 'AMPHI', 'Amphithéâtre'
        SALLE = 'SALLE', 'Salle'

    exam        = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='rooms')
    room_type   = models.CharField(max_length=10, choices=RoomType.choices)
    room_name   = models.CharField(max_length=100, verbose_name='Nom de la salle')
    capacity    = models.PositiveIntegerField(verbose_name='Capacité')
    # Teachers assigned to supervise this specific room
    supervisors = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='exam_room_supervisions',
        blank=True,
    )

    class Meta:
        verbose_name = 'Salle d\'examen'
        verbose_name_plural = 'Salles d\'examen'
        ordering = ['room_type', 'room_name']  # AMPHI < SALLE alphabetically

    def __str__(self):
        return f"{self.room_name} ({self.get_room_type_display()}) — {self.exam}"


class ExamStudentAssignment(models.Model):
    """Maps a student to a specific room for a specific exam (assigned in order)."""
    exam        = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='student_assignments')
    exam_room   = models.ForeignKey(ExamRoom, on_delete=models.CASCADE, related_name='student_assignments')
    student     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_room_assignments')
    order       = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('exam', 'student')   # each student appears only once per exam
        ordering = ['order']
        verbose_name = 'Affectation étudiant'

    def __str__(self):
        return f"{self.student.full_name} → {self.exam_room.room_name}"


class ExamAttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('present',  'Présent'),
        ('absent',   'Absent'),
        ('unmarked', 'Non marqué'),
    ]
    exam        = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attendance_records')
    exam_room   = models.ForeignKey(ExamRoom, on_delete=models.CASCADE, related_name='attendance_records')
    student     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_attendance_records')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unmarked')
    marked_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='marked_exam_attendances',
    )
    marked_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('exam', 'student')
        verbose_name = 'Présence examen'
        verbose_name_plural = 'Présences examen'

    def __str__(self):
        return f"{self.student.full_name} — {self.exam} — {self.status}"
