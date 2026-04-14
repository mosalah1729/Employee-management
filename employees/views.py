from employees.models import FormTemplate, Employee
from employees.serializers import FormTemplateSerializer, EmployeeSerializer
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q


class FormTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = FormTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FormTemplate.objects.filter(created_by=self.request.user).prefetch_related('fields')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Employee.objects.filter(
            created_by=self.request.user
        ).select_related('form_template').prefetch_related('field_values__field')

        search = self.request.query_params.get('search', '')
        field_label = self.request.query_params.get('field', '')
        field_value = self.request.query_params.get('value', '')

        if search:
            qs = qs.filter(field_values__value__icontains=search).distinct()

        if field_label and field_value:
            qs = qs.filter(
                field_values__field__label__icontains=field_label,
                field_values__value__icontains=field_value
            ).distinct()
        elif field_label:
            qs = qs.filter(field_values__field__label__icontains=field_label).distinct()

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
