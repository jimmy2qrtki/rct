from django import forms
from django.contrib.auth.models import User
from .models import Profile
from django.contrib.auth.forms import UserCreationForm

class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name']

    # Не забудьте добавить обработку email в представление
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

class ProfileUpdateForm(forms.ModelForm):
    api_key = forms.CharField(widget=forms.PasswordInput(), required=False)

    class Meta:
        model = Profile
        fields = ['phone_number', 'api_key']

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ('email', 'password1', 'password2')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user