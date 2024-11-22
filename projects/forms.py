from django import forms
from .models import Project, Event

class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'description', 'excel_file']
        widgets = {
            'description': forms.Textarea(attrs={'minlength': 10}),
        }

class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ['event_type', 'description', 'photo_count', 'event_date']
        widgets = {
            'description': forms.Textarea(attrs={'minlength': 10}),
            'event_date': forms.SelectDateWidget(),
        }