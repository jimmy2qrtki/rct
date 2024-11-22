from django.db import models

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    # Дополнительные поля для хранения Excel документа
    excel_file = models.FileField(upload_to='excel/', null=True, blank=True)

    def __str__(self):
        return self.name

class Event(models.Model):
    EVENT_TYPES = (
        ('montage', 'Монтаж'),
        ('audit', 'Аудит'),
        ('dismantle', 'Демонтаж'),
    )
    project = models.ForeignKey(Project, related_name='events', on_delete=models.CASCADE)
    event_type = models.CharField(choices=EVENT_TYPES, max_length=20)
    description = models.TextField()
    photo_count = models.IntegerField()
    event_date = models.DateField()

    def __str__(self):
        return f"{self.event_type} on {self.event_date}"