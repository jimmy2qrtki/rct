import datetime
from django import forms
from .models import Project, Event

class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'description', 'excel_file']
        labels = {
            'name': 'Название',
            'description': 'Описание',
            'excel_file': 'Excel-файл',
        }

class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ['event_type', 'description', 'photo_count', 'event_date', 'duration_days']
        labels = {
            'event_type': 'Событие',
            'description': 'Описание',
            'photo_count': 'Кол-во фото',
            'event_date': 'Дата начала',
            'duration_days': 'Срок выполнения (в днях)',
        }
        widgets = {
            'event_date': forms.SelectDateWidget(),
        }