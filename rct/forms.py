from django import forms
from django.contrib.auth.models import User
from .models import Profile, ExecutorProfile
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordResetForm
from django.core.exceptions import ValidationError

class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'profile__input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

class ProfileUpdateForm(forms.ModelForm):
    api_key = forms.CharField(
        widget=forms.PasswordInput(render_value=True, attrs={'class': 'profile__input'}), 
        required=False
    )
    
    class Meta:
        model = Profile
        fields = ['phone_number', 'api_key']
        widgets = {
            'phone_number': forms.TextInput(attrs={'class': 'profile__input'}),
        }

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ('email', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Добавляем класс 'form-control' для bootstrap или любой другой необходимый класс
        self.fields['email'].widget.attrs['class'] = 'registration__input'
        self.fields['password1'].widget.attrs['class'] = 'registration__input'
        self.fields['password2'].widget.attrs['class'] = 'registration__input'
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError("Пользователь с таким email уже существует.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        # Используем email в качестве username
        user.username = self.cleaned_data['email']
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user
    
class ExecutorRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ("email", "password1", "password2")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Добавляем класс 'form-control' для bootstrap или любой другой необходимый класс
        self.fields['email'].widget.attrs['class'] = 'registration__input'
        self.fields['password1'].widget.attrs['class'] = 'registration__input'
        self.fields['password2'].widget.attrs['class'] = 'registration__input'

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError("Пользователь с таким email уже существует.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.email
        if commit:
            user.save()
        return user

class ExecutorProfileForm(forms.ModelForm):
    class Meta:
        model = ExecutorProfile
        fields = ('name', 'phone_number', 'district')
        labels = {
            'name': 'Имя',
            'phone_number': 'Телефон',
            'district': 'Округ',
        }
        widgets = {
            'name': forms.TextInput(attrs={'class': 'profile__input'}),
            'phone_number': forms.TextInput(attrs={'class': 'profile__input'}),
            'district': forms.TextInput(attrs={'class': 'profile__input'}),
        }

class EmailAuthenticationForm(AuthenticationForm):
    email = forms.EmailField()

class CustomPasswordResetForm(PasswordResetForm):
    # Здесь вы можете добавить или переопределить поля, если нужно
    pass