document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('.navbar-item[href="/forms/"]').classList.add('active');
    
    const fieldList = document.getElementById('field-list');
    const addFieldBtn = document.getElementById('add-field-btn');
    const saveFormBtn = document.getElementById('save-form-btn');
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');
    const pageHeader = document.getElementById('page-header');
    
    let fieldCount = 0;
    
    // Check if we're in edit mode (URL has ?id=)
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    
    if (editId) {
        // Edit Mode
        pageHeader.innerHTML = `
            <h1>Edit Form</h1>
            <p class="mt-1 text-secondary">Modify the fields of this form template.</p>
        `;
        saveFormBtn.innerHTML = '<i class="fa-solid fa-save"></i> Update Form Template';
        
        // Load existing form data
        try {
            const response = await axios.get(`/forms/${editId}/`);
            const form = response.data;
            document.getElementById('form-name').value = form.name;
            
            // Sort fields by order and render
            form.fields.sort((a, b) => a.order - b.order).forEach(field => {
                addField(field.label, field.input_type, field.is_required, field.id);
            });
        } catch (error) {
            errorMsg.textContent = 'Failed to load form data. It may have been deleted.';
            errorMsg.style.display = 'block';
        }
    } else {
        // Create Mode — empty state
        updateEmptyState();
    }

    addFieldBtn.addEventListener('click', () => {
        addField('', 'text', false);
    });

    saveFormBtn.addEventListener('click', () => saveForm(editId));

    function addField(label = '', type = 'text', isRequired = false, dbId = null) {
        fieldCount++;
        const id = `field-${fieldCount}`;
        
        // Remove empty state placeholder if present
        const tempEmpty = fieldList.querySelector('.temp-empty');
        if (tempEmpty) tempEmpty.remove();
        
        const row = document.createElement('div');
        row.className = 'field-row flex gap-4 items-center';
        row.dataset.id = id;
        if (dbId) {
            row.dataset.dbId = dbId;
        }
        row.draggable = true;
        
        row.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">
                <i class="fa-solid fa-grip-vertical"></i>
            </div>
            
            <div style="flex: 2;">
                <input type="text" class="form-control field-label" placeholder="Field Label (e.g. Employee Name)" value="${label}" required>
            </div>
            
            <div style="flex: 1;">
                <select class="form-control field-type">
                    <option value="text"     ${type === 'text'     ? 'selected' : ''}>Text</option>
                    <option value="number"   ${type === 'number'   ? 'selected' : ''}>Number</option>
                    <option value="email"    ${type === 'email'    ? 'selected' : ''}>Email</option>
                    <option value="date"     ${type === 'date'     ? 'selected' : ''}>Date</option>
                    <option value="tel"      ${type === 'tel'      ? 'selected' : ''}>Phone</option>
                    <option value="password" ${type === 'password' ? 'selected' : ''}>Password</option>
                    <option value="textarea" ${type === 'textarea' ? 'selected' : ''}>Text Area</option>
                </select>
            </div>
            
            <div style="flex: 0; min-width: 100px; display: flex; align-items: center; gap: 0.5rem;" title="Mark as Required">
                <input type="checkbox" class="field-required" id="req-${id}" ${isRequired ? 'checked' : ''}>
                <label for="req-${id}" style="color: var(--text-secondary); cursor: pointer; font-size: 0.9rem;">Required</label>
            </div>

            <div>
                <button class="btn btn-danger remove-field-btn" style="padding: 0.5rem 0.75rem;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        
        fieldList.appendChild(row);
        
        row.querySelector('.remove-field-btn').addEventListener('click', () => {
            row.remove();
            updateEmptyState();
        });
        
        setupDragAndDrop(row);
    }

    function updateEmptyState() {
        if (fieldList.children.length === 0) {
            fieldList.innerHTML = `<div class="empty-state temp-empty"><i class="fa-solid fa-shapes"></i><p>No fields added yet. Click "Add Field" to start.</p></div>`;
        }
    }

    let draggedItem = null;

    function setupDragAndDrop(item) {
        item.addEventListener('dragstart', function() {
            draggedItem = this;
            setTimeout(() => this.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
        });

        item.addEventListener('dragenter', function(e) {
            e.preventDefault();
            if (this !== draggedItem) {
                let rect = this.getBoundingClientRect();
                let offset = e.clientY - rect.top;
                if (offset > rect.height / 2) {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedItem, this);
                }
            }
        });
    }

    async function saveForm(editId) {
        const formName = document.getElementById('form-name').value.trim();
        
        if (!formName) {
            alert('Please provide a form name.');
            return;
        }

        const rows = document.querySelectorAll('.field-row');
        if (rows.length === 0) {
            alert('Please add at least one field.');
            return;
        }

        const fields = [];
        let isValid = true;

        rows.forEach((row, index) => {
            const label = row.querySelector('.field-label').value.trim();
            const type = row.querySelector('.field-type').value;
            const isReq = row.querySelector('.field-required').checked;
            const dbId = row.dataset.dbId;

            if (!label) {
                isValid = false;
                row.querySelector('.field-label').style.borderColor = 'var(--danger-color)';
            } else {
                row.querySelector('.field-label').style.borderColor = '';
                const fieldData = { label, input_type: type, is_required: isReq, order: index };
                if (dbId) {
                    fieldData.id = parseInt(dbId, 10);
                }
                fields.push(fieldData);
            }
        });

        if (!isValid) {
            alert('Please fill in all field labels.');
            return;
        }

        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';
        
        try {
            saveFormBtn.disabled = true;
            saveFormBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            
            const payload = { name: formName, fields };
            
            if (editId) {
                await axios.put(`/forms/${editId}/`, payload);
                successMsg.textContent = 'Form updated successfully! Redirecting...';
            } else {
                await axios.post('/forms/', payload);
                successMsg.textContent = 'Form created successfully! Redirecting...';
            }
            
            successMsg.style.display = 'block';
            setTimeout(() => { window.location.href = '/forms/'; }, 1000);
            
        } catch (error) {
            console.error(error);
            errorMsg.textContent = 'Failed to save form. Please try again.';
            errorMsg.style.display = 'block';
            saveFormBtn.disabled = false;
            saveFormBtn.innerHTML = '<i class="fa-solid fa-save"></i> ' + (editId ? 'Update' : 'Save') + ' Form Template';
        }
    }
});
