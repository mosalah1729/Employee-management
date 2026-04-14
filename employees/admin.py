from django.contrib import admin
from .models import FormTemplate, FormField, Employee, EmployeeFieldValue


class FormFieldInline(admin.TabularInline):
    model = FormField
    extra = 1
    ordering = ['order']


@admin.register(FormTemplate)
class FormTemplateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'created_at')
    inlines = [FormFieldInline]


class EmployeeFieldValueInline(admin.TabularInline):
    model = EmployeeFieldValue
    extra = 0
    readonly_fields = ('field',)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', '__str__', 'form_template', 'created_by', 'created_at')
    list_filter = ('form_template',)
    inlines = [EmployeeFieldValueInline]


@admin.register(FormField)
class FormFieldAdmin(admin.ModelAdmin):
    list_display = ('id', 'label', 'form_template', 'input_type', 'order', 'is_required')
    list_filter = ('form_template', 'input_type')


@admin.register(EmployeeFieldValue)
class EmployeeFieldValueAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'field', 'value')
    list_filter = ('field__form_template',)
