from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Убрали null=True
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    excel_file = models.FileField(upload_to='excel/', null=True, blank=True)

    def get_next_event(self):
        today = timezone.now().date()
        next_event = self.events.filter(event_date__gte=today).order_by('event_date').first()
        return next_event

class Event(models.Model):
    EVENT_TYPES = (
        ('montage', 'Монтаж'),
        ('audit', 'Аудит'),
        ('dismantle', 'Демонтаж'),
    )
    project = models.ForeignKey(Project, related_name='events', on_delete=models.CASCADE)
    event_type = models.CharField(choices=EVENT_TYPES, max_length=20)
    description = models.TextField(blank=True)
    photo_count = models.IntegerField()
    event_date = models.DateField()

    def __str__(self):
        return f"{self.event_type} on {self.event_date}"
    
class Address(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return self.name
    
class RequestCounter(models.Model):
    count = models.PositiveIntegerField(default=1000)
    last_reset = models.DateTimeField(auto_now=True)

    def reset(self):
        self.count = 1000
        self.last_reset = timezone.now()
        self.save()