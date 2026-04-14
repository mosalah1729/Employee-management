from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    path('login/', TemplateView.as_view(template_name='login.html'), name='page-login'),
    path('register/', TemplateView.as_view(template_name='register.html'), name='page-register'),
    path('dashboard/', TemplateView.as_view(template_name='dashboard.html'), name='page-dashboard'),
    path('profile/', TemplateView.as_view(template_name='profile.html'), name='page-profile'),
    path('change-password/', TemplateView.as_view(template_name='change_password.html'), name='page-change-password'),
]
