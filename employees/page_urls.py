from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    path('forms/', TemplateView.as_view(template_name='form_list.html'), name='page-form-list'),
    path('forms/designer/', TemplateView.as_view(template_name='form_designer.html'), name='page-form-designer'),
    path('employees/', TemplateView.as_view(template_name='employee_list.html'), name='page-employee-list'),
    path('employees/add/', TemplateView.as_view(template_name='employee_form.html'), name='page-employee-add'),
]
