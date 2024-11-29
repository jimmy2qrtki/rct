from django.db import models
from django.contrib.auth.models import User
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True)
    first_name = models.CharField(max_length=30, blank=True)  # Имя
    api_key = models.CharField(max_length=100, blank=True)    # API KEY

    def __str__(self):
        return self.user.username
    
class ExecutorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255, blank=True)
    start_address = models.CharField(max_length=255)
    district_choices = [
        ('САО', 'САО'),
        ('ВАО', 'ВАО'),
        ('ЮАО', 'ЮАО'),
        ('ЗАО', 'ЗАО'),
    ]
    district = models.CharField(max_length=3, choices=district_choices)
    api_key = models.CharField(max_length=255, blank=True)