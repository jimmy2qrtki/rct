from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, get_backends, authenticate
from .forms import UserUpdateForm, ProfileUpdateForm, CustomUserCreationForm, ExecutorRegistrationForm, ExecutorProfileForm
from django.contrib import messages
from django.contrib.auth.models import Group
from .models import ExecutorProfile

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            
            # Добавляем пользователя в группу "Менеджер"
            managers_group, created = Group.objects.get_or_create(name='Менеджер')
            user.groups.add(managers_group)

            # Аутентифицируем пользователя с использованием email и пароля
            authenticated_user = authenticate(request, username=form.cleaned_data['email'], password=form.cleaned_data['password1'])
            
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
            # Проверка на принадлежность к группе 'Исполнитель'
            if user.groups.filter(name='Исполнитель').exists():
                return redirect('executor_profile')  # Перенаправление на профиль исполнителя
            else:
                return redirect('profile')  # Перенаправление на обычный профиль
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

            profile_instance = p_form.save(commit=False)
            # Проверяем, есть ли новый API KEY, если нет, оставляем старое значение
            new_api_key = p_form.cleaned_data['api_key']

            if new_api_key:
                profile_instance.api_key = new_api_key  # обновляем только если введён новый ключ

            profile_instance.save()  # Сохраняем изменения в профиле

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

def executor_register(request):
    if request.method == 'POST':
        form = ExecutorRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            executor_group, created = Group.objects.get_or_create(name='Исполнитель')
            user.groups.add(executor_group)

            # Аутентификация пользователя сразу после его создания
            authenticated_user = authenticate(request, username=user.username, password=form.cleaned_data['password1'])
            
            # Проверка: если пользователь аутентифицирован (должен быть)
            if authenticated_user is not None:
                # Указываем явный бэкенд для login
                for backend in get_backends():
                    if backend.authenticate(request, username=user.username, password=form.cleaned_data['password1']):
                        authenticated_user.backend = f"{backend.__module__}.{backend.__class__.__name__}"
                        break
                
                login(request, authenticated_user)
                return redirect('executor_profile')
    else:
        form = ExecutorRegistrationForm()
    return render(request, 'registration/executor/register.html', {'form': form})

# для перенапраления исполнителя при выходе
def executor_logout(request):
    logout(request)
    return redirect('login')  # Перенаправить обратно на логин исполнителя

@login_required
def executor_profile(request):
    try:
        profile = request.user.executorprofile
    except ExecutorProfile.DoesNotExist:
        profile = ExecutorProfile(user=request.user)

    if request.method == 'POST':
        form = ExecutorProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('executor_profile')  # Добавь путь куда будет перенаправлено после сохранения
    else:
        form = ExecutorProfileForm(instance=profile)
    return render(request, 'registration/executor/profile.html', {'form': form})