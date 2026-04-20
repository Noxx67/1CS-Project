from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from schedules.models import AttendanceRecord, AbsenceCounter

class Command(BaseCommand):
    help = 'Validates weekly absences and updates the AbsenceCounter for each student.'

    def handle(self, *args, **options):
        self.stdout.write('Starting weekly absence validation...')
        
        # Consider the past 7 days
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        # Get all attendance records from the past week that are marked as 'absent'
        absent_records = AttendanceRecord.objects.filter(
            status='absent',
            session_instance__date__gt=week_ago,
            session_instance__date__lte=today
        )

        updates_count = 0
        for record in absent_records:
            student = record.student
            session = record.session_instance.session

            # Get or create the absence counter for this student and session
            counter, created = AbsenceCounter.objects.get_or_create(
                student=student,
                session=session,
                defaults={'absence_count': 0}
            )

            # Increment the counter
            counter.absence_count += 1
            counter.save()
            updates_count += 1

            self.stdout.write(
                self.style.SUCCESS(f'Incremented absence for {student.full_name} in {session.title}. Total: {counter.absence_count}')
            )

        self.stdout.write(self.style.SUCCESS(f'Weekly absence validation complete. {updates_count} absences recorded.'))
