document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('.navbar-item[href="/employees/"]').classList.add('active');

    const templateSelectorWrapper = document.getElementById('template-selector-wrapper');
    const templateSelect = document.getElementById('form-template-select');
    const dynamicContainer = document.getElementById('dynamic-fields-container');
    const fieldsRenderArea = document.getElementById('fields-render-area');
    const noTemplatesMsg = document.getElementById('no-templates-msg');
    const employeeForm = document.getElementById('employee-form');
    const saveBtn = document.getElementById('save-employee-btn');
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    let currentTemplate = null;

    // Detect edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');

    if (editId) {
        pageTitle.textContent = 'Edit Employee';
        pageSubtitle.textContent = 'Update the employee record below.';
        saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Update Employee';
    }

    // Fetch all form templates for the selector
    let allTemplates = [];
    try {
        const response = await axios.get('/forms/');
        allTemplates = response.data;

        templateSelect.innerHTML = '<option value="">-- Select a form template --</option>';

        if (allTemplates.length === 0) {
            templateSelectorWrapper.style.display = 'none';
            noTemplatesMsg.style.display = 'block';
            return;
        }

        allTemplates.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.name;
            option.dataset.template = JSON.stringify(t);
            templateSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Failed to load templates:', error);
        templateSelect.innerHTML = '<option value="">-- Error loading templates --</option>';
    }

    // If in edit mode — load existing employee and pre-populate
    if (editId) {
        try {
            const empResponse = await axios.get(`/employees/${editId}/`);
            const emp = empResponse.data;

            // Hide the template selector in edit mode (template is fixed for existing employee)
            templateSelectorWrapper.style.display = 'none';

            // Find and use the employee's associated template
            const matchedTemplate = allTemplates.find(t => t.id === emp.form_template);
            if (matchedTemplate) {
                currentTemplate = matchedTemplate;
                renderFields(matchedTemplate.fields, emp.field_values);
                dynamicContainer.style.display = 'block';
            } else {
                // Template was deleted; try fetching directly
                const formResp = await axios.get(`/forms/${emp.form_template}/`);
                currentTemplate = formResp.data;
                renderFields(currentTemplate.fields, emp.field_values);
                dynamicContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to load employee:', error);
            errorMsg.textContent = 'Failed to load employee data. It may have been deleted.';
            errorMsg.style.display = 'block';
        }
    }

    // Template select change handler (create mode only)
    templateSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (!e.target.value) {
            dynamicContainer.style.display = 'none';
            currentTemplate = null;
            return;
        }
        currentTemplate = JSON.parse(selectedOption.dataset.template);
        renderFields(currentTemplate.fields, []);
        dynamicContainer.style.display = 'block';
    });

    function renderFields(fields, existingValues = []) {
        fieldsRenderArea.innerHTML = '';

        if (!fields || fields.length === 0) {
            fieldsRenderArea.innerHTML = '<p class="text-secondary">This form template has no fields.</p>';
            return;
        }

        // Build a lookup map of existing values by field id
        const valueMap = {};
        (existingValues || []).forEach(fv => {
            valueMap[fv.field] = fv.value;
        });

        // Always sort by the CURRENT field.order so UI matches rearranged template
        [...fields].sort((a, b) => a.order - b.order).forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group mb-3';

            const requiredMarker = field.is_required
                ? '<span style="color: var(--danger-color)">*</span>' : '';
            const isReqAttr = field.is_required ? 'required' : '';
            const existingVal = valueMap[field.id] || '';

            let inputHtml = '';
            if (field.input_type === 'textarea') {
                inputHtml = `<textarea
                    class="form-control dynamic-input"
                    data-field-id="${field.id}"
                    rows="3"
                    ${isReqAttr}>${existingVal}</textarea>`;
            } else {
                inputHtml = `<input
                    type="${field.input_type}"
                    class="form-control dynamic-input"
                    data-field-id="${field.id}"
                    value="${existingVal}"
                    ${isReqAttr}>`;
            }

            group.innerHTML = `
                <label class="form-label">${field.label} ${requiredMarker}</label>
                ${inputHtml}
            `;

            fieldsRenderArea.appendChild(group);
        });
    }

    // Form submit — handles both Create and Update
    employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentTemplate) return;

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        // Collect field values
        const fieldValues = [];
        document.querySelectorAll('.dynamic-input').forEach(input => {
            fieldValues.push({
                field: parseInt(input.dataset.fieldId),
                value: input.value.trim()
            });
        });

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            if (editId) {
                // PUT — update existing employee
                await axios.put(`/employees/${editId}/`, {
                    form_template: currentTemplate.id,
                    field_values: fieldValues
                });
                successMsg.textContent = 'Employee updated successfully! Redirecting...';
            } else {
                // POST — create new employee
                await axios.post('/employees/', {
                    form_template: currentTemplate.id,
                    field_values: fieldValues
                });
                successMsg.textContent = 'Employee added successfully! Redirecting...';
            }

            successMsg.style.display = 'block';
            setTimeout(() => { window.location.href = '/employees/'; }, 1000);

        } catch (error) {
            console.error(error);
            errorMsg.textContent = 'Failed to save employee. Make sure all required fields are valid.';
            errorMsg.style.display = 'block';
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> ' + (editId ? 'Update' : 'Save') + ' Employee';
        }
    });
});
