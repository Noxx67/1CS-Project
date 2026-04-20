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
