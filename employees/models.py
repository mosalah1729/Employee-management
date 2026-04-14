from django.db import models
from django.contrib.auth.models import User


class FormTemplate(models.Model):
    name = models.CharField(max_length=200)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='form_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class FormField(models.Model):
    INPUT_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('email', 'Email'),
        ('password', 'Password'),
        ('tel', 'Phone'),
        ('textarea', 'Textarea'),
        ('select', 'Select'),
    ]

    form_template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='fields')
    label = models.CharField(max_length=200)
    input_type = models.CharField(max_length=20, choices=INPUT_TYPES, default='text')
    order = models.PositiveIntegerField(default=0)
    is_required = models.BooleanField(default=False)
    placeholder = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.form_template.name} — {self.label}"


class Employee(models.Model):
    form_template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='employees')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='employees')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        # Show first field value if exists
        first_val = self.field_values.first()
        return first_val.value if first_val else f"Employee #{self.pk}"


class EmployeeFieldValue(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='field_values')
    field = models.ForeignKey(FormField, on_delete=models.CASCADE)
    value = models.TextField(blank=True)

    class Meta:
        unique_together = ('employee', 'field')

    def __str__(self):
        return f"{self.field.label}: {self.value}"
