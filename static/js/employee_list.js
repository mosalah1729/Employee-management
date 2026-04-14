document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.navbar-item[href="/employees/"]').classList.add('active');
    
    const tbody = document.getElementById('employees-tbody');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');
    const globalSearch = document.getElementById('global-search');
    const filterField = document.getElementById('filter-field');
    const filterVal = document.getElementById('filter-val');
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const emptyStateMsg = document.getElementById('empty-state-msg');
    
    let searchTimeout = null;

    // Initial fetch
    fetchEmployees();

    // Event listeners for search/filter
    globalSearch.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchEmployees();
        }, 300);
    });

    applyFilterBtn.addEventListener('click', () => {
        fetchEmployees();
    });

    // Pressing enter in filter values triggers search
    [filterField, filterVal].forEach(el => {
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchEmployees();
            }
        });
    });

    async function fetchEmployees() {
        try {
            // Build query params
            const params = new URLSearchParams();
            
            const search = globalSearch.value.trim();
            if (search) params.append('search', search);
            
            const field = filterField.value.trim();
            const val = filterVal.value.trim();
            
            if (field) params.append('field', field);
            if (val) params.append('value', val);
            
            const response = await axios.get(`/employees/?${params.toString()}`);
            const employees = response.data;
            
            renderEmployees(employees, params.toString().length > 0);
            
        } catch (error) {
            console.error('Error fetching employees', error);
        }
    }

    function renderEmployees(employees, isSearch) {
        if (employees.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            emptyStateMsg.textContent = isSearch ? "No employees match your search criteria." : "Start by adding your first employee to the system.";
            return;
        }
        
        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
        tbody.innerHTML = '';
        
        employees.forEach(emp => {
            const date = new Date(emp.created_at).toLocaleDateString();
            
            // Extract primary info (first field) and additional data
            let primaryInfo = `<span style="color: var(--text-secondary); font-style: italic;">No data</span>`;
            let additionalDataHtml = '';
            
            if (emp.field_values && emp.field_values.length > 0) {
                // Sort by current field order so rearranging the form is reflected correctly
                const sorted = [...emp.field_values].sort((a, b) => a.field_order - b.field_order);

                const firstField = sorted[0];
                primaryInfo = `<strong>${firstField.value || '<em style="opacity:0.5">—</em>'}</strong> <br><small class="text-secondary">${firstField.field_label}</small>`;

                // Additional data badges (skip first, show next 3)
                const extraFields = sorted.slice(1, 4);
                extraFields.forEach(fv => {
                    if (fv.value) {
                        let displayValue = fv.value.length > 20 ? fv.value.substring(0, 20) + '...' : fv.value;
                        additionalDataHtml += `<div style="font-size: 0.8rem; margin-bottom: 2px;">
                            <span style="color: var(--text-secondary);">${fv.field_label}:</span>
                            <span>${displayValue}</span>
                        </div>`;
                    }
                });

                if (emp.field_values.length > 4) {
                    additionalDataHtml += `<div style="font-size: 0.8rem; color: var(--accent-color);">+ ${emp.field_values.length - 4} more</div>`;
                }

                if (!additionalDataHtml) {
                    additionalDataHtml = `<span class="text-secondary" style="font-size: 0.8rem;">No additional data</span>`;
                }
            } else {
                additionalDataHtml = `<span class="text-secondary" style="font-size: 0.8rem;">Empty record</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${primaryInfo}</td>
                <td><span class="badge" style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${emp.form_template_name}</span></td>
                <td>${additionalDataHtml}</td>
                <td><span style="font-size: 0.9rem;">${date}</span><br><small class="text-secondary">by ${emp.created_by_username || 'unknown'}</small></td>
                <td>
                    <div class="flex gap-2">
                        <a href="/employees/add/?id=${emp.id}" class="btn btn-secondary" style="padding: 0.4rem 0.6rem; font-size: 0.9rem;" title="Edit Employee">
                            <i class="fa-solid fa-pen"></i>
                        </a>
                        <button class="btn btn-danger delete-btn" data-id="${emp.id}" style="padding: 0.4rem 0.6rem; font-size: 0.9rem;" title="Delete Employee">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(tr);
        });

        // Attach delete handlers
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.id;
                if (confirm('Are you sure you want to delete this employee record?')) {
                    try {
                        await axios.delete(`/employees/${id}/`);
                        fetchEmployees();
                    } catch (err) {
                        alert('Failed to delete user.');
                    }
                }
            });
        });
    }
});
