document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') {
        window.location.href = '/login';
        return;
    }

    loadTeachers();

    // Search Listener
    const searchInput = document.getElementById('teacherSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            const rows = document.querySelectorAll('#teacherTableBody tr');
            rows.forEach(row => {
                const name = row.cells[0]?.textContent.toLowerCase() || '';
                const email = row.cells[1]?.textContent.toLowerCase() || '';
                if (name.includes(term) || email.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Modal Logic
    const modal = document.getElementById('teacherModal');
    const addBtn = document.getElementById('addTeacherBtn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('teacherForm');

    addBtn.onclick = () => {
        openModal();
    };

    closeBtn.onclick = () => modal.classList.remove('active');
    cancelBtn.onclick = () => modal.classList.remove('active');

    window.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveTeacher();
    };

    // Event Delegation for Table Actions
    const tbody = document.getElementById('teacherTableBody');
    tbody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-lite');
        const deleteBtn = e.target.closest('.btn-delete-lite');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const name = editBtn.dataset.name;
            const email = editBtn.dataset.email;
            const phone = editBtn.dataset.phone;
            window.editTeacher(id, name, email, phone);
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            window.deleteTeacher(id);
        }
    });
});

async function loadTeachers() {
    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/teachers/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const teachers = await res.json();
            renderTeachers(teachers);
        } else {
            console.error("Failed to fetch teachers");
        }
    } catch (e) {
        console.error(e);
    }
}

function renderTeachers(teachers) {
    const tbody = document.getElementById('teacherTableBody');
    tbody.innerHTML = '';

    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No teachers found.</td></tr>';
        return;
    }

    teachers.forEach(t => {
        const html = `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; background:#e0e7ff; color:#4f46e5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                            ${t.name.charAt(0).toUpperCase()}
                        </div>
                        ${t.name}
                    </div>
                </td>
                <td>${t.email}</td>
                <td>${t.phone || '-'}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="action-btn btn-edit-lite" title="Edit Teacher" 
                            data-id="${t.user_id}" 
                            data-name="${t.name}" 
                            data-email="${t.email}" 
                            data-phone="${t.phone || ''}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete-lite" title="Delete Teacher" 
                            data-id="${t.user_id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', html);
    });
}

function openModal(id = null, name = '', email = '', phone = '') {
    const modal = document.getElementById('teacherModal');
    const title = document.getElementById('modalTitle');
    const idInput = document.getElementById('teacherId');
    const nameInput = document.getElementById('teacherName');
    const emailInput = document.getElementById('teacherEmail');
    const phoneInput = document.getElementById('teacherPhone');
    const passGroup = document.getElementById('passwordGroup');
    const passInput = document.getElementById('teacherPassword');
    const passLabel = passGroup.querySelector('.form-label');

    idInput.value = id || '';
    nameInput.value = name;
    emailInput.value = email;
    phoneInput.value = phone || '';

    if (id) {
        title.textContent = 'Edit Teacher';
        passGroup.style.display = 'none';
        passInput.required = false;
    } else {
        title.textContent = 'Add New Teacher';
        passGroup.style.display = 'block';
        passLabel.textContent = 'Password';
        passInput.required = true;
    }
    passInput.value = '';

    modal.classList.add('active');
}

window.editTeacher = function (id, name, email, phone) {
    openModal(id, name, email, phone === 'null' ? '' : phone); // Fix null string issue
};

async function saveTeacher() {
    const id = document.getElementById('teacherId').value;
    const name = document.getElementById('teacherName').value;
    const email = document.getElementById('teacherEmail').value;
    const phone = document.getElementById('teacherPhone').value;
    const password = document.getElementById('teacherPassword').value;

    const saveBtn = document.querySelector('#teacherForm button[type="submit"]');
    const originalBtnText = saveBtn.textContent;

    const data = { name, email, phone };
    if (!id && password) data.password = password;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/teachers/${id}` : '/teachers/';

    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const token = localStorage.getItem('access_token');
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(id ? 'Updated successfully' : 'Created successfully', 'success');
            document.getElementById('teacherModal').classList.remove('active');
            loadTeachers();
        } else {
            const err = await res.json();
            showToast(`Error: ${err.detail || 'Failed to save'}`, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
}

window.deleteTeacher = async function (id) {
    if (!confirm('Are you sure you want to delete this teacher? This might affect batches assigned to them.')) return;

    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/teachers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            showToast('Teacher deleted successfully', 'success');
            loadTeachers();
        } else {
            const data = await res.json();
            showToast(`Failed to delete: ${data.detail || 'Unknown error'}`, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error', 'error');
    }
};

// Toast Notification Helper
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
