from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from .forms import UserUpdateForm, ProfileUpdateForm
from django.contrib.auth import login, authenticate
from django.contrib import messages
from .forms import CustomUserCreationForm

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            authenticated_user = authenticate(request, username=form.cleaned_data['username'], password=form.cleaned_data['password1'])
            
            if authenticated_user is not None:
                login(request, authenticated_user)
                return redirect('login')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'registration/register.html', {'form': form})

@login_required 
def profile(request):
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, instance=request.user.profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, 'Ваш профиль был успешно обновлен!')
            return redirect('profile')
        else:
            messages.error(request, 'Пожалуйста, исправьте ошибки в форме.')
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile)

    # Переопределяем метки полей
    u_form.fields['username'].label = 'Логин'
    u_form.fields['email'].label = 'Почта:'
    p_form.fields['phone_number'].label = 'Телефон:'

    context = {
        'u_form': u_form,
        'p_form': p_form
    }

    return render(request, 'registration/profile.html', context)