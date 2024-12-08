from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings

class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Убрали null=True
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    excel_file = models.FileField(upload_to='excel/', null=True, blank=True)
    organization = models.CharField(max_length=255, blank=True, null=True)  # Новое поле
    product = models.CharField(max_length=255, blank=True, null=True)  # Новое поле

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
    duration_days = models.IntegerField(help_text="Количество дней на выполнение")
    assigned_users = models.ManyToManyField(User, through='EventUser', blank=True, related_name='events_as_assignee')

    def __str__(self):
        return f"{self.event_type} on {self.event_date}"

    def due_date(self):
        """Вычислить дату завершения на основе даты начала и срока выполнения."""
        return self.event_date + timezone.timedelta(days=self.duration_days)

    
class Address(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    order = models.PositiveIntegerField(default=0)  # Добавляем поле для сортировки

    class Meta:
        ordering = ['order']  # Определяем стандартный порядок сортировки

    def __str__(self):
        return self.name
    
class EventAddress(models.Model):
    event = models.ForeignKey(Event, related_name='addresses', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    order = models.PositiveIntegerField(default=0)  # Добавляем поле для сортировки
    assigned_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)  # Новое поле

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name
    
class EventUser(models.Model):
    STATUS_CHOICES = [
        ('chosen', 'Выбран'),
        ('assigned', 'Назначен'),
        ('confirmed', 'Подтвержден'),
        ('declined', 'Отказ'),
        ('in_progress', 'В работе'),
        ('completed', 'Завершён'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey('Event', on_delete=models.CASCADE)
    status = models.CharField(max_length=11, choices=STATUS_CHOICES, default='chosen')
    
class RequestCounter(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    count = models.PositiveIntegerField(default=1000)
    last_reset = models.DateTimeField(auto_now=True)

    def reset(self):
        self.count = 1000
        self.last_reset = timezone.now()
        self.save()