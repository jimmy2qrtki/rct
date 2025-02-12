import datetime
from django import forms
from .models import Project, Event, Organization

class ProjectForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Стандартные организации
        standard_organizations = [
            ("", "---------"),
            ("Пятёрочка", "Пятёрочка"),
            ("Перекрёсток", "Перекрёсток"),
            ("Магнит", "Магнит"),
            ("Лента", "Лента"),
            ("Дикси", "Дикси"),
        ]
        
        # Получаем организации, созданные пользователем
        if user:
            user_organizations = Organization.objects.filter(user=user)
            user_organization_choices = [(org.name, org.name) for org in user_organizations]
        else:
            user_organization_choices = []

        # Объединяем стандартные организации и организации пользователя
        self.fields['organization'].choices = standard_organizations + user_organization_choices + [("add_new", "Добавить организацию")]

    organization = forms.ChoiceField(choices=[], required=False)
    new_organization = forms.CharField(max_length=255, required=False, label='Новая организация')

    class Meta:
        model = Project
        fields = ['name', 'organization', 'product', 'description', 'excel_file']
        labels = {
            'name': 'Название',
            'description': 'Описание',
            'excel_file': 'Excel-файл',
            'organization': 'Организация взаимодействия',
            'product': 'Продукция взаимодействия',
        }

    def clean(self):
        cleaned_data = super().clean()
        organization = cleaned_data.get("organization")
        new_organization = cleaned_data.get("new_organization")
        
        if organization == "add_new" and not new_organization:
            self.add_error('new_organization', "Пожалуйста, введите имя новой организации.")
        
        return cleaned_data

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