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
            authenticated_user = authenticate(request, email=form.cleaned_data['email'], password=form.cleaned_data['password1'])
            
            if authenticated_user is not None:
                login(request, authenticated_user)
                return redirect('profile')  # Перенаправляем на профиль после регистрации
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'registration/register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']
        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('profile')
        else:
            messages.error(request, 'Неверный Email или пароль.')
    return render(request, 'registration/login.html')

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
        u_form = UserUpdateForm(instance=request.user)  # email не редактируется
        p_form = ProfileUpdateForm(instance=request.user.profile)

    # Переопределяем метки полей
    email = request.user.email  # Получаем email пользователя
    p_form.fields['phone_number'].label = 'Телефон:'
    p_form.fields['api_key'].label = 'API KEY:'

    context = {
        'user': request.user,
        'u_form': u_form,
        'p_form': p_form,
        'email': email  # Передаем email в контекст для отображения
    }

    return render(request, 'registration/profile.html', context)

