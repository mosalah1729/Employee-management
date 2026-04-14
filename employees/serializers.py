from employees.models import FormTemplate, FormField, Employee, EmployeeFieldValue
from rest_framework import serializers


class FormFieldSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = FormField
        fields = ('id', 'label', 'input_type', 'order', 'is_required', 'placeholder')


class FormTemplateSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = FormTemplate
        fields = ('id', 'name', 'fields', 'created_by_username', 'employee_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by_username', 'employee_count', 'created_at', 'updated_at')

    def get_employee_count(self, obj):
        return obj.employees.count()

    def create(self, validated_data):
        fields_data = validated_data.pop('fields', [])
        template = FormTemplate.objects.create(**validated_data)
        for i, field_data in enumerate(fields_data):
            field_data['order'] = field_data.get('order', i)
            FormField.objects.create(form_template=template, **field_data)
        return template

    def update(self, instance, validated_data):
        fields_data = validated_data.pop('fields', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        
        if fields_data is not None:
            existing_fields = {field.id: field for field in instance.fields.all()}
            incoming_ids = []
            
            for i, field_data in enumerate(fields_data):
                field_data['order'] = field_data.get('order', i)
                field_id = field_data.get('id')
                
                if field_id and field_id in existing_fields:
                    # Update existing field
                    field = existing_fields[field_id]
                    field.label = field_data.get('label', field.label)
                    field.input_type = field_data.get('input_type', field.input_type)
                    field.order = field_data.get('order', field.order)
                    field.is_required = field_data.get('is_required', field.is_required)
                    field.placeholder = field_data.get('placeholder', field.placeholder)
                    field.save()
                    incoming_ids.append(field_id)
                else:
                    # Create new field
                    # Pop 'id' if it accidentally got passed for a non-existing record
                    field_data.pop('id', None)
                    new_field = FormField.objects.create(form_template=instance, **field_data)
                    incoming_ids.append(new_field.id)
            
            # Delete fields that were completely removed from the form
            for field_id, field in existing_fields.items():
                if field_id not in incoming_ids:
                    field.delete()
                    
        return instance


class EmployeeFieldValueSerializer(serializers.ModelSerializer):
    field_label = serializers.CharField(source='field.label', read_only=True)
    field_input_type = serializers.CharField(source='field.input_type', read_only=True)
    field_order = serializers.IntegerField(source='field.order', read_only=True)

    class Meta:
        model = EmployeeFieldValue
        fields = ('id', 'field', 'field_label', 'field_input_type', 'field_order', 'value')


class EmployeeSerializer(serializers.ModelSerializer):
    field_values = EmployeeFieldValueSerializer(many=True)
    form_template_name = serializers.CharField(source='form_template.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Employee
        fields = ('id', 'form_template', 'form_template_name', 'field_values',
                  'created_by_username', 'created_at', 'updated_at')
        read_only_fields = ('id', 'form_template_name', 'created_by_username', 'created_at', 'updated_at')

    def create(self, validated_data):
        field_values_data = validated_data.pop('field_values', [])
        employee = Employee.objects.create(**validated_data)
        for fv in field_values_data:
            EmployeeFieldValue.objects.create(employee=employee, **fv)
        return employee

    def update(self, instance, validated_data):
        field_values_data = validated_data.pop('field_values', None)
        instance.form_template = validated_data.get('form_template', instance.form_template)
        instance.save()
        if field_values_data is not None:
            instance.field_values.all().delete()
            for fv in field_values_data:
                EmployeeFieldValue.objects.create(employee=instance, **fv)
        return instance
