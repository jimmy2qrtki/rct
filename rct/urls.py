from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Общие обработчики
    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('login/', views.login_view, name='login'),
    path('accounts/login/', views.login_view, name='login'),
    # Страницы для исполнителей
    path('executor/register/', views.executor_register, name='executor_register'),
    path('executor/profile/', views.executor_profile, name='executor_profile'),
    path('executor/logout/', views.executor_logout, name='executor_logout'),
]