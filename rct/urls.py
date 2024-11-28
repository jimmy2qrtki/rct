from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('login/', views.login_view, name='login'),
    path('accounts/login/', views.login_view, name='login'),
]